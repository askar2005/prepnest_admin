import { SharedModulePage } from './shared-module-page';

const config = { title: 'Interview Preparation', description: 'Create topics, upload notes PDFs, and add MCQs for interview preparation.' };

export default function InterviewPreparationPage() {
  return <SharedModulePage config={config} />;
}
