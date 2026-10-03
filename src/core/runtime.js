export const runtime = {
    loginState: { logged: false, code: '' },
    isPlaying: false,
    autoPlayRunId: 0,
    stopFloatingImage: null,
    routeGuard: { listenRoute: true },
    paperData: {},
    showAnswer: false,
    cachedPaperSubjectList: null,
    alerted: 0,
    currentSortedSubjects: [],
    boundAnswerNavElements: new WeakSet(),
};
