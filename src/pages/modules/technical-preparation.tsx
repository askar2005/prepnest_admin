import { SharedModulePage } from './shared-module-page';

const config = { title: 'Technical Preparation', description: 'Create topics, upload notes PDFs, and add MCQs for technical preparation.' };

export default function TechnicalPreparationPage() {
  return <SharedModulePage config={config} />;
}
