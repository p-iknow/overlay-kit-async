import { type ReactNode, useState } from 'react';
import { DemoAlertDialogWithState, DemoAlertDialogWithOverlay } from './demos/demo-basic';
import { DemoAlertDialogWithOpenAsync } from './demos/demo-open-async';
import {
  DemoOpenAsyncWithoutDefaultValue,
  DemoOpenAsyncWithDefaultValue,
} from './demos/demo-open-async-external-close';
import { DemoCloseByOverlayId, DemoCloseAll, DemoStackedOverlays } from './demos/demo-overlay-control';

const tabs: Array<{ label: string; content: ReactNode }> = [
  {
    label: 'Basic',
    content: (
      <>
        <DemoAlertDialogWithState />
        <DemoAlertDialogWithOverlay />
      </>
    ),
  },
  {
    label: 'openAsync',
    content: <DemoAlertDialogWithOpenAsync />,
  },
  {
    label: 'External Close',
    content: (
      <>
        <DemoOpenAsyncWithoutDefaultValue />
        <DemoOpenAsyncWithDefaultValue />
      </>
    ),
  },
  {
    label: 'Overlay Control',
    content: (
      <>
        <DemoCloseByOverlayId />
        <DemoCloseAll />
        <DemoStackedOverlays />
      </>
    ),
  },
];

export function Demo() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="mb-6 text-2xl font-bold">overlay-kit Demo</h1>
      <nav className="mb-8 flex gap-1 border-b border-gray-200">
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            type="button"
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === index ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(index)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="space-y-6">{tabs[activeTab].content}</div>
    </div>
  );
}
