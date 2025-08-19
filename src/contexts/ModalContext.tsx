import React, { createContext, useContext, useState, ReactNode } from 'react';
import LogoutConfirmationModal from '@components/LogoutConfirmationModal';

interface ModalContextType {
  showLogoutModal: () => void;
  hideLogoutModal: () => void;
  confirmLogout: (callback: () => void) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutCallback, setLogoutCallback] = useState<{ fn: (() => void) | null }>({ fn: null });

  const showLogoutModal = () => {
    setLogoutModalVisible(true);
  };

  const hideLogoutModal = () => {
    setLogoutModalVisible(false);
    setLogoutCallback({ fn: null });
  };

  const confirmLogout = (callback: () => void) => {
    setLogoutCallback({ fn: callback });
    setLogoutModalVisible(true);
  };

  const handleConfirmLogout = () => {
    if (logoutCallback.fn) {
      logoutCallback.fn();
    }
    hideLogoutModal();
  };

  const value: ModalContextType = {
    showLogoutModal,
    hideLogoutModal,
    confirmLogout,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      <LogoutConfirmationModal
        visible={logoutModalVisible}
        onClose={hideLogoutModal}
        onConfirm={handleConfirmLogout}
      />
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};