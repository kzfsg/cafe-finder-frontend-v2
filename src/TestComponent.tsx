import { useEffect } from 'react';

export default function TestComponent() {
  useEffect(() => {
    console.log('TestComponent mounted');
    return () => {
      console.log('TestComponent unmounted');
    };
  }, []);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h2>Test Component</h2>
      <p>If you can see this, React is working!</p>
    </div>
  );
}
