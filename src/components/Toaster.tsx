import React from 'react';
import { Toaster as HotToaster } from 'react-hot-toast';

const Toaster: React.FC = () => {
    return <HotToaster position="top-right" reverseOrder={false} />;
};

export default Toaster;
