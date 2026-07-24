import { SharedModulePage } from './shared-module-page';

const config = { title: 'Mock Tests', description: 'Create mock tests with questions, timer, and marking.' };

export default function MockTestsPage() {
  return <SharedModulePage config={config} />;
}
