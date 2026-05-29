import * as XLSX from 'xlsx'
import { GraphQLError } from 'graphql'
import { supabase } from '../utils/supabase'
import type { GqlContext } from '../helpers/helpers.auth'
import { requireAdmin } from '../helpers/helpers.auth'

// ── Constants ─────────────────────────────────────────────────────────────────

const VIRTUAL_CLASSROOMS = ['PVI', 'PPS', 'TES']

const DAY_MAP: Record<string, string> = {
    L: 'Lunes',
    M: 'Martes',
    I: 'Miércoles',
    J: 'Jueves',
    V: 'Viernes',
    S: 'Sábado',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TITLES = new Set(['DR.', 'DRA.', 'LIC.', 'LICA.', 'MSC.', 'PHD.', 'ING.', 'PROF.', 'MG.', 'MGS.', 'DR', 'DRA', 'LIC', 'ING', 'PROF'])

function formatProfessorName(raw: string): string {
    const parts = raw.trim().split(/\s+/).filter(p => !TITLES.has(p.toUpperCase()))
    if (parts.length < 2) return raw.trim()
    const last = parts[parts.length - 1]
    const nombre = last ? last.charAt(0).toUpperCase() + last.slice(1).toLowerCase() : ''
    const apellidos = parts
        .slice(0, -1)
        .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
        .join(' ')
    return `${nombre} ${apellidos}`.trim()
}

function parseTime(raw: string): { startTime: string; endTime: string } | null {
    if (!raw || !raw.includes('-')) return null
    const parts = raw.trim().split('-')
    const start = parts[0]
    const end = parts[1]
    if (!start || !end) return null
    const fmt = (t: string) =>
        t.length === 4 ? `${t.slice(0, 2)}:${t.slice(2)}` : t
    return { startTime: fmt(start), endTime: fmt(end) }
}

function isVirtualClassroom(code: string): boolean {
    return VIRTUAL_CLASSROOMS.includes(code.trim().toUpperCase())
}

function toStr(val: string | number | undefined | null): string {
    if (val === undefined || val === null) return ''
    return String(val).trim()
}

// ── Row type ──────────────────────────────────────────────────────────────────

interface ExcelRow {
    CARRERA?: string | number
    PERIODO?: string | number
    NRC?: string | number
    CODIGO?: string | number
    CURSO?: string | number
    'IDENT PROFESOR'?: string | number
    'NOMBRE PROFESOR'?: string | number
    'NIVEL CURSO'?: string | number
    'SECC. CURSO'?: string | number
    'CUPO MAXIMO'?: number
    MATRICULADOS?: number
    CREDITOS?: number
    DÍAS?: string | number
    HORAS?: string | number
    AULA?: string | number
    'HORAS TOTALES'?: number
}

// ── Import result ─────────────────────────────────────────────────────────────

interface ImportResult {
    professors: number
    areas: number
    classrooms: number
    courses: number
    schedules: number
    skipped: number
    errors: string[]
}

// ── Core import logic ─────────────────────────────────────────────────────────

async function processExcelBuffer(buffer: Buffer): Promise<ImportResult> {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) throw new Error('El archivo Excel no contiene hojas')
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) throw new Error('No se pudo leer la hoja del archivo Excel')
    const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet)

    const result: ImportResult = {
        professors: 0,
        areas: 0,
        classrooms: 0,
        courses: 0,
        schedules: 0,
        skipped: 0,
        errors: [],
    }

    // ── Caches to avoid redundant DB calls ──────────────────────────────────────
    const professorCache = new Map<string, string>()  // legalId  → professorId
    const areaCache = new Map<string, string>()  // name     → areaId
    const classroomCache = new Map<string, string>()  // code     → classroomId
    const courseCache = new Map<string, string>()  // nrc+code → courseId

    for (const row of rows) {
        try {
            const legalId = toStr(row['IDENT PROFESOR'])
            const rawName = toStr(row['NOMBRE PROFESOR'])
            const areaName = toStr(row.CARRERA)
            const nrc = toStr(row.NRC)
            const courseCode = toStr(row.CODIGO)
            const courseName = toStr(row.CURSO)
            const section = toStr(row['SECC. CURSO'])
            const rawDay = toStr(row.DÍAS)
            const rawHours = toStr(row.HORAS)
            const rawClassroom = toStr(row.AULA).toUpperCase()

            if (!legalId || !rawName || !nrc || !courseCode) {
                result.skipped++
                continue
            }

            // ── 1. Professor ────────────────────────────────────────────────────────
            let professorId = professorCache.get(legalId)
            if (!professorId) {
                const fullName = formatProfessorName(rawName)
                const { data: existing } = await supabase
                    .from('Professor')
                    .select('professorId')
                    .eq('legalId', legalId)
                    .maybeSingle()

                if (existing) {
                    professorId = existing.professorId
                } else {
                    const { data: created, error } = await supabase
                        .from('Professor')
                        .insert({ legalId, fullName })
                        .select('professorId')
                        .single()
                    if (error || !created) throw new Error(`Profesor ${rawName}: ${error?.message}`)
                    professorId = created.professorId
                    result.professors++
                }
                professorCache.set(legalId, professorId as string)
            }

            // ── 2. Area ─────────────────────────────────────────────────────────────
            let areaId = areaCache.get(areaName)
            if (!areaId) {
                const { data: existing } = await supabase
                    .from('Area')
                    .select('areaId')
                    .eq('name', areaName)
                    .maybeSingle()

                if (existing) {
                    areaId = existing.areaId
                } else {
                    const { data: created, error } = await supabase
                        .from('Area')
                        .insert({ name: areaName })
                        .select('areaId')
                        .single()
                    if (error || !created) throw new Error(`Área ${areaName}: ${error?.message}`)
                    areaId = created.areaId
                    result.areas++
                }
                areaCache.set(areaName, areaId as string)
            }

            // ── 3. Classroom ────────────────────────────────────────────────────────
            let classroomId = classroomCache.get(rawClassroom)
            if (!classroomId && rawClassroom) {
                const { data: existing } = await supabase
                    .from('Classroom')
                    .select('classroomId')
                    .eq('code', rawClassroom)
                    .maybeSingle()

                if (existing) {
                    classroomId = existing.classroomId
                } else {
                    const capacity = isVirtualClassroom(rawClassroom) ? 0 : 30
                    const { data: created, error } = await supabase
                        .from('Classroom')
                        .insert({ code: rawClassroom, capacity })
                        .select('classroomId')
                        .single()
                    if (error || !created) throw new Error(`Aula ${rawClassroom}: ${error?.message}`)
                    classroomId = created.classroomId
                    result.classrooms++
                }
                classroomCache.set(rawClassroom, classroomId as string)
            }

            // ── 4. Course ───────────────────────────────────────────────────────────
            const courseKey = `${nrc}__${courseCode}`
            let courseId = courseCache.get(courseKey)
            if (!courseId) {
                const { data: existing } = await supabase
                    .from('Course')
                    .select('courseId')
                    .eq('nrc', nrc)
                    .eq('code', courseCode)
                    .maybeSingle()

                if (existing) {
                    courseId = existing.courseId
                } else {
                    const { data: created, error } = await supabase
                        .from('Course')
                        .insert({ nrc, code: courseCode, name: courseName, section, areaId, professorId })
                        .select('courseId')
                        .single()
                    if (error || !created) throw new Error(`Curso ${nrc}/${courseCode}: ${error?.message}`)
                    courseId = created.courseId
                    result.courses++
                }
                courseCache.set(courseKey, courseId as string)
            }

            // ── 5. Schedule ─────────────────────────────────────────────────────────
            if (!rawDay || !rawHours || !classroomId) {
                result.skipped++
                continue
            }

            const day = DAY_MAP[rawDay] ?? rawDay
            const times = parseTime(rawHours)
            if (!times) {
                result.skipped++
                continue
            }

            // Avoid duplicate schedules (same course + day + startTime)
            const { data: existingSchedule } = await supabase
                .from('Schedule')
                .select('scheduleId')
                .eq('courseId', courseId)
                .eq('day', day)
                .eq('startTime', times.startTime)
                .maybeSingle()

            if (!existingSchedule) {
                const { error } = await supabase
                    .from('Schedule')
                    .insert({
                        day,
                        startTime: times.startTime,
                        endTime: times.endTime,
                        classroomId,
                        courseId,
                    })
                if (error) throw new Error(`Horario ${nrc} ${day}: ${error.message}`)
                result.schedules++
            } else {
                result.skipped++
            }

        } catch (err: any) {
            result.errors.push(err.message ?? String(err))
        }
    }

    return result
}

// ── Resolver ──────────────────────────────────────────────────────────────────

export const importMutations = {
    importExcel: async (
        _: unknown,
        { file }: { file: File },
        ctx: GqlContext
    ) => {
        // requireAdmin(ctx)

        console.log('file type:', typeof file)
        console.log('file constructor:', file?.constructor?.name)
        console.log('file keys:', Object.keys(file ?? {}))
        console.log('file methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(file ?? {})))

        const chunks: Buffer[] = []
        for await (const chunk of file.stream()) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        }
        const buffer = Buffer.concat(chunks)

        const result = await processExcelBuffer(buffer)

        return {
            success: result.errors.length === 0,
            professors: result.professors,
            areas: result.areas,
            classrooms: result.classrooms,
            courses: result.courses,
            schedules: result.schedules,
            skipped: result.skipped,
            errors: result.errors,
        }
    },
}