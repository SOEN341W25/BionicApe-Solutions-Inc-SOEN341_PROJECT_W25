import React from 'react';
import { useState } from 'react';

export const RegisterPage = () => {
    const [showPassword, setShowPassword ] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        
    });
  return (
    <div>RegisterPage</div>
  )
}
