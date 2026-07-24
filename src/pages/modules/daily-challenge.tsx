import { SharedModulePage } from './shared-module-page';

const config = { title: 'Daily Challenge', description: 'Create daily challenge questions.' };

export default function DailyChallengePage() {
  return <SharedModulePage config={config} />;
}
