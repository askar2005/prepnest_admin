import { SharedModulePage } from './shared-module-page';

const config = { title: 'GATE Preparation', description: 'Create topics, upload notes PDFs, and add MCQs for GATE preparation.' };

export default function GatePreparationPage() {
  return <SharedModulePage config={config} />;
}
