import React from 'react';
import { Search } from 'lucide-react';

export default function Header() {
    return (
        <header style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Logo */}
            <div style={{ flexShrink: 0 }}>
                <span className="text-2xl font-black bg-gradient-to-r from-[#1E105C] via-[#8F94FB] to-[#2B2091] bg-clip-text text-transparent">
                    IntentCart
                </span>
            </div>

            {/* Search Input Container */}
            <div style={{ flex: 1, maxWidth: '650px', margin: '0 32px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search
                        style={{
                            position: 'absolute',
                            left: '16px',
                            width: '18px',
                            height: '18px',
                            color: '#1f2937',
                            pointerEvents: 'none'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="What are you looking for ?"
                        style={{
                            width: '100%',
                            backgroundColor: '#eef2f6',
                            color: '#1f2937',
                            fontSize: '14px',
                            paddingLeft: '46px',
                            paddingRight: '16px',
                            paddingTop: '10px',
                            paddingBottom: '10px',
                            borderRadius: '12px',
                            border: 'none',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <button style={{
                    backgroundColor: '#432bd9',
                    color: '#ffffff',
                    fontWeight: '600',
                    fontSize: '14px',
                    padding: '10px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer'
                }}>
                    Sign Up
                </button>
                <button style={{
                    backgroundColor: '#ffffff',
                    color: '#432bd9',
                    fontWeight: '600',
                    fontSize: '14px',
                    padding: '10px 24px',
                    borderRadius: '12px',
                    border: '1px solid #432bd9',
                    cursor: 'pointer'
                }}>
                    Sign In
                </button>
            </div>
        </header>
    );
}