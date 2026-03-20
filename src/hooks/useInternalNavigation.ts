import { useState } from 'react';

export type MainView = 'dashboard' | 'calendar' | 'contacts' | 'report' | 'guide' | 'settings';

export function useInternalNavigation(initialView: MainView = 'dashboard') {
    const [historyStack, setHistoryStack] = useState<MainView[]>([initialView]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const currentView = historyStack[historyIndex];

    const navigate = (view: MainView) => {
        if (view === currentView) return;
        // Slice history to current index (discarding forward history if any) and add new view
        const newStack = historyStack.slice(0, historyIndex + 1);
        newStack.push(view);

        setHistoryStack(newStack);
        setHistoryIndex(newStack.length - 1);
    };

    const goBack = () => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
        }
    };

    const goForward = () => {
        if (historyIndex < historyStack.length - 1) {
            setHistoryIndex(prev => prev + 1);
        }
    };

    return {
        currentView,
        navigate,
        goBack,
        goForward,
        canGoBack: historyIndex > 0,
        canGoForward: historyIndex < historyStack.length - 1,
        historyStack // exposed if needed for debugging
    };
}
