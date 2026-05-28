export function mapClassroom(row: Record<string, any>) {
    return {
        classroomId: row.classroomId,
        code: row.code,
        capacity: row.capacity,
    }
}

export function mapSchedule(row: Record<string, any>) {
    return {
        scheduleId: row.scheduleId,
        classroomCode: row.Classroom?.code ?? '',
        day: row.day,
        startTime: row.startTime,
        endTime: row.endTime,
        subject: row.Course?.name ?? '',
        teacherName: row.Course?.Professor?.fullName ?? '',
    }
}

export function mapLoan(row: Record<string, any>, nameMap: Record<string, string>) {
    return {
        loanId: row.loanId,
        classroomCode: row.Classroom?.code ?? '',
        userId: row.userId,
        requesterName: nameMap[row.userId] ?? 'Desconocido',
        loanDate: row.loanDate ? String(row.loanDate).slice(0, 10) : '',
        startTime: row.startTime,
        endTime: row.endTime,
        reason: row.reason,
        status: row.status,
    }
}