export type FieldType = 'text' | 'textarea' | 'select' | 'number' | 'checkbox';

export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { label: string; value: string }[];
};

export type ResourceConfig = {
  resource: string;
  title: string;
  description: string;
  fields: FieldConfig[];
  searchPlaceholder: string;
};

export const resourceConfigs: Record<string, ResourceConfig> = {
  'preparation-categories': {
    resource: 'preparation-categories',
    title: 'Categories',
    description: 'Create and manage preparation categories.',
    searchPlaceholder: 'Search categories',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'domain', label: 'Domain', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  subjects: {
    resource: 'subjects',
    title: 'Subjects',
    description: 'Create and manage subjects.',
    searchPlaceholder: 'Search subjects',
    fields: [
      { name: 'preparationCategoryId', label: 'Category ID', type: 'text', required: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true },
    ],
  },
  topics: {
    resource: 'topics',
    title: 'Topics',
    description: 'Create and manage topics.',
    searchPlaceholder: 'Search topics',
    fields: [
      { name: 'preparationCategoryId', label: 'Category ID', type: 'text', required: true },
      { name: 'subjectId', label: 'Subject ID', type: 'text' },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true },
    ],
  },
  'study-materials': {
    resource: 'study-materials',
    title: 'Study Materials',
    description: 'Upload notes, PDFs, images, videos, and practice content.',
    searchPlaceholder: 'Search study materials',
    fields: [
      { name: 'preparationCategoryId', label: 'Category ID', type: 'text', required: true },
      { name: 'subjectId', label: 'Subject ID', type: 'text' },
      { name: 'topicId', label: 'Topic ID', type: 'text' },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', required: true, options: [
        { label: 'Note', value: 'NOTE' },
        { label: 'PDF', value: 'PDF' },
        { label: 'Image', value: 'IMAGE' },
        { label: 'Video', value: 'VIDEO' },
        { label: 'Code', value: 'CODE' },
        { label: 'Practice', value: 'PRACTICE' },
        { label: 'Solution', value: 'SOLUTION' },
      ] },
      { name: 'content', label: 'Content', type: 'textarea' },
      { name: 'externalUrl', label: 'External URL', type: 'text' },
      { name: 'difficulty', label: 'Difficulty', type: 'select', options: [
        { label: 'Easy', value: 'EASY' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'Hard', value: 'HARD' },
      ] },
    ],
  },
  'mcq-questions': {
    resource: 'mcq-questions',
    title: 'MCQs',
    description: 'Create multiple-choice questions.',
    searchPlaceholder: 'Search MCQs',
    fields: [
      { name: 'preparationCategoryId', label: 'Category ID', type: 'text', required: true },
      { name: 'subjectId', label: 'Subject ID', type: 'text' },
      { name: 'topicId', label: 'Topic ID', type: 'text' },
      { name: 'question', label: 'Question', type: 'textarea', required: true },
      { name: 'optionA', label: 'Option A', type: 'text', required: true },
      { name: 'optionB', label: 'Option B', type: 'text', required: true },
      { name: 'optionC', label: 'Option C', type: 'text', required: true },
      { name: 'optionD', label: 'Option D', type: 'text', required: true },
      { name: 'correctOption', label: 'Correct Option', type: 'text', required: true },
      { name: 'explanation', label: 'Explanation', type: 'textarea' },
      { name: 'difficulty', label: 'Difficulty', type: 'select', options: [
        { label: 'Easy', value: 'EASY' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'Hard', value: 'HARD' },
      ] },
    ],
  },
  'mock-tests': {
    resource: 'mock-tests',
    title: 'Mock Tests',
    description: 'Create and publish mock tests.',
    searchPlaceholder: 'Search mock tests',
    fields: [
      { name: 'preparationCategoryId', label: 'Category ID', type: 'text', required: true },
      { name: 'subjectId', label: 'Subject ID', type: 'text' },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'durationMinutes', label: 'Duration Minutes', type: 'number', required: true },
      { name: 'negativeMarking', label: 'Negative Marking', type: 'number' },
      { name: 'publishStatus', label: 'Status', type: 'select', options: [
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Published', value: 'PUBLISHED' },
        { label: 'Archived', value: 'ARCHIVED' },
      ] },
    ],
  },
  'interview-questions': {
    resource: 'interview-questions',
    title: 'Interview',
    description: 'Manage interview questions and answers.',
    searchPlaceholder: 'Search interview questions',
    fields: [
      { name: 'preparationCategoryId', label: 'Category ID', type: 'text', required: true },
      { name: 'subjectId', label: 'Subject ID', type: 'text' },
      { name: 'topicId', label: 'Topic ID', type: 'text' },
      { name: 'question', label: 'Question', type: 'textarea', required: true },
      { name: 'answer', label: 'Answer', type: 'textarea', required: true },
      { name: 'sampleResponse', label: 'Sample Response', type: 'textarea' },
      { name: 'tips', label: 'Tips', type: 'textarea' },
      { name: 'difficulty', label: 'Difficulty', type: 'select', options: [
        { label: 'Easy', value: 'EASY' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'Hard', value: 'HARD' },
      ] },
    ],
  },
  notifications: {
    resource: 'notifications',
    title: 'Notifications',
    description: 'Create placement and college notifications.',
    searchPlaceholder: 'Search notifications',
    fields: [
      { name: 'preparationCategoryId', label: 'Category ID', type: 'text' },
      { name: 'subjectId', label: 'Subject ID', type: 'text' },
      { name: 'topicId', label: 'Topic ID', type: 'text' },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'category', label: 'Category', type: 'select', required: true, options: [
        { label: 'Placement Drives', value: 'PLACEMENT_DRIVES' },
        { label: 'Internships', value: 'INTERNSHIPS' },
        { label: 'Hackathons', value: 'HACKATHONS' },
        { label: 'Company Hiring', value: 'COMPANY_HIRING' },
        { label: 'Exam Updates', value: 'EXAM_UPDATES' },
        { label: 'Scholarships', value: 'SCHOLARSHIPS' },
        { label: 'College Announcements', value: 'COLLEGE_ANNOUNCEMENTS' },
      ] },
      { name: 'priority', label: 'Priority', type: 'select', options: [
        { label: 'Low', value: 'LOW' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'High', value: 'HIGH' },
      ] },
    ],
  },
};
