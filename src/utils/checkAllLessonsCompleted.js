export default function checkAllLessonsCompleted(parsedData, index) {

    // 提取所有章
    const chapters = parsedData.data || [];
    
    // 将所有节展平到一维数组
    const allSections = chapters.flatMap(chapter => chapter.children || []);
    
    // 检查index合法性
    if (index < 0 || index >= allSections.length) return false;
    
    // 获取目标节及其子课
    const targetSection = allSections[index];
    const lessons = targetSection.children || [];
    
    // 检查所有课是否完成
    return lessons.every(lesson => lesson.learnStatus === 2);
}


