import { useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    window.frameworkReady?.();
  }, []);

  return <MainLayout />;
}