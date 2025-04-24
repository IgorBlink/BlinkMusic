import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Footer from './Footer';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="content">
        <main>
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout; 