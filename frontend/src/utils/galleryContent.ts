export const FALLBACK_GALLERY_DESCRIPTION = 
  "A memorable learning experience captured at Easy Talk Institute, highlighting student engagement, academic excellence, and communication development.";

interface GalleryPreset {
  matchKeywords: string[];
  title: string;
  description: string;
}

const PROFESSIONAL_PRESETS: GalleryPreset[] = [
  {
    matchKeywords: ['english assessment', 'assessment & communication', 'evaluation 2026', 'assessment test'],
    title: 'English Assessment & Communication Evaluation 2026',
    description: 'Students actively participating in a comprehensive English proficiency assessment designed to evaluate grammar, vocabulary, speaking confidence, communication skills, and overall language development.'
  },
  {
    matchKeywords: ["teacher's day celebration", "teachers day celebration", 'student appreciation program', 'teacher appreciation'],
    title: "Teacher's Day Celebration & Student Appreciation Program",
    description: 'A memorable event where students expressed gratitude towards their mentors through cultural performances, speeches, and appreciation activities that strengthened the learning community.'
  },
  {
    matchKeywords: ['cultural performance', 'student cultural performance', 'performance showcase'],
    title: 'Student Cultural Performance Showcase',
    description: 'Students confidently demonstrated their communication and presentation abilities through cultural activities, stage performances, and public speaking sessions.'
  },
  {
    matchKeywords: ['award & recognition', 'award and recognition', 'awards & recognition', 'student recognition ceremony', 'academic excellence & student recognition'],
    title: 'Academic Excellence & Student Recognition Ceremony',
    description: 'Recognizing outstanding student achievements, academic progress, communication excellence, and active participation in institute activities.'
  },
  {
    matchKeywords: ['spoken english activities', 'spoken english practice', 'interactive spoken english'],
    title: 'Interactive Spoken English Practice Sessions',
    description: 'Live classroom activities focused on improving fluency, pronunciation, vocabulary enhancement, confidence building, and real-world communication skills.'
  },
  {
    matchKeywords: ['interview preparation', 'interview readiness', 'placement workshop'],
    title: 'Professional Interview Readiness Workshop',
    description: 'Students participating in mock interviews, group discussions, confidence-building exercises, and placement-oriented communication training.'
  },
  {
    matchKeywords: ['special moments', 'community moments', 'celebration moments'],
    title: 'Memorable Faculty & Student Community Moments',
    description: 'Joyful and inspiring moments between mentors and learners celebrating collaborative milestones, cultural harmony, and community building at Easy Talk Institute.'
  }
];

export const formatCategoryLabel = (categoryName: string): string => {
  if (!categoryName) return '';
  const trimmed = categoryName.trim();
  if (trimmed === 'All') return 'All Activities';
  
  const lower = trimmed.toLowerCase();
  if (lower === 'award & recognition' || lower === 'awards and recognition' || lower === 'award and recognition') {
    return 'Awards & Recognition';
  }
  if (lower === 'cultural events' || lower === 'cultural event') {
    return 'Cultural Events';
  }
  if (lower === 'classroom sessions' || lower === 'classroom session') {
    return 'Classroom Sessions';
  }
  if (lower === 'assessment activities' || lower === 'assessment activity') {
    return 'Assessment Activities';
  }
  if (lower === 'student achievements' || lower === 'student achievement') {
    return 'Student Achievements';
  }
  return trimmed;
};

export const getProfessionalGalleryContent = (item: {
  title?: string;
  description?: string;
  category?: string;
}) => {
  const rawTitle = (item.title || '').trim();
  const rawDesc = (item.description || '').trim();
  const lowerTitle = rawTitle.toLowerCase();

  let finalTitle = rawTitle;
  let finalDesc = rawDesc;

  // Match known institute events if existing text is generic
  const matched = PROFESSIONAL_PRESETS.find(preset =>
    preset.matchKeywords.some(kw => lowerTitle.includes(kw))
  );

  if (matched) {
    // If the title matches known events
    if (
      lowerTitle.includes('english assessment') ||
      lowerTitle.includes("teacher's day celebration") ||
      lowerTitle.includes('cultural performance') ||
      lowerTitle.includes('award & recognition') ||
      lowerTitle.includes('spoken english activities') ||
      lowerTitle.includes('interview preparation') ||
      lowerTitle.includes('special moments')
    ) {
      finalTitle = matched.title;
    }

    // If description is empty or matches generic description template
    if (
      !rawDesc ||
      rawDesc.toLowerCase().includes('students participating in the english assessment test') ||
      rawDesc.toLowerCase().includes("teachers' day celebration at easy talk") ||
      rawDesc.toLowerCase().includes('participated in songs, speeches') ||
      rawDesc.toLowerCase().includes('capturing joyful and memorable moments') ||
      rawDesc.length < 35
    ) {
      finalDesc = matched.description;
    }
  }

  // Fallback if description is still empty
  if (!finalDesc || !finalDesc.trim()) {
    finalDesc = FALLBACK_GALLERY_DESCRIPTION;
  }

  return {
    title: finalTitle,
    description: finalDesc
  };
};

export const formatGalleryDate = (dateStr?: string | Date): string => {
  if (!dateStr) return 'Recent';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Recent';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};
