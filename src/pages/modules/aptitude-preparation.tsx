import { SharedModulePage } from './shared-module-page';

const config = { title: 'Aptitude Preparation', description: 'Create topics, upload notes PDFs, and add MCQs for aptitude preparation.' };

export default function AptitudePreparationPage() {
  return <SharedModulePage config={config} />;
}
