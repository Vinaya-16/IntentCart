import React, { useState } from 'react';

const CouponValidator = ({ onValidate, onApply }) => {
    const [couponCode, setCouponCode] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [orderAmount, setOrderAmount] = useState('');
    const [orderId, setOrderId] = useState('');
    const [validationResult, setValidationResult] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isApplying, setIsApplying] = useState(false);

    const handleValidate = async () => {
        if (!couponCode.trim()) {
            alert('Please enter a coupon code');
            return;
        }

        setIsValidating(true);
        setValidationResult(null);

        try {
            const result = await onValidate({
                couponCode: couponCode.trim(),
                customerId: customerId.trim() || undefined,
                orderAmount: parseFloat(orderAmount) || undefined
            });

            if (result) {
                setValidationResult({
                    valid: true,
                    coupon: result
                });
            } else {
                setValidationResult({
                    valid: false,
                    message: 'Invalid or expired coupon'
                });
            }
        } catch (error) {
            setValidationResult({
                valid: false,
                message: error.response?.data?.message || 'Error validating coupon'
            });
        } finally {
            setIsValidating(false);
        }
    };

    const handleApply = async () => {
        if (!validationResult?.valid) {
            alert('Please validate the coupon first');
            return;
        }

        if (!orderAmount || parseFloat(orderAmount) <= 0) {
            alert('Please enter a valid order amount');
            return;
        }

        if (!orderId.trim()) {
            alert('Please enter an order ID');
            return;
        }

        setIsApplying(true);
        try {
            await onApply({
                couponCode: couponCode.trim(),
                customerId: customerId.trim() || undefined,
                orderId: orderId.trim(),
                orderAmount: parseFloat(orderAmount)
            });
            setCouponCode('');
            setCustomerId('');
            setOrderAmount('');
            setOrderId('');
            setValidationResult(null);
        } catch (error) {
            console.error('Error applying coupon:', error);
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Coupon Code *</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter coupon code"
                        disabled={isValidating}
                    />
                    <button
                        onClick={handleValidate}
                        disabled={isValidating}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isValidating ? 'Validating...' : 'Validate'}
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer ID (optional)</label>
                <input
                    type="text"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter customer ID"
                />
            </div>

            {validationResult && (
                <div className={`p-4 rounded-lg ${validationResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    {validationResult.valid ? (
                        <div>
                            <p className="text-sm font-medium text-green-700">✓ Coupon is valid!</p>
                            <div className="mt-2 text-sm">
                                <p><span className="text-slate-500">Name:</span> {validationResult.coupon.name}</p>
                                <p><span className="text-slate-500">Discount:</span> {validationResult.coupon.discountValue}{validationResult.coupon.discountType === 'percentage' ? '%' : ' ₹'}</p>
                                {validationResult.coupon.minOrderAmount > 0 && (
                                    <p><span className="text-slate-500">Min Order:</span> ₹{validationResult.coupon.minOrderAmount}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm font-medium text-red-700">✗ {validationResult.message}</p>
                    )}
                </div>
            )}

            {validationResult?.valid && (
                <div className="border-t pt-4 space-y-4">
                    <h4 className="font-medium text-sm">Apply to Order</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Order Amount *</label>
                            <input
                                type="number"
                                value={orderAmount}
                                onChange={(e) => setOrderAmount(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter amount"
                                step="0.01"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Order ID *</label>
                            <input
                                type="text"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter order ID"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleApply}
                        disabled={isApplying || !orderAmount || !orderId}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isApplying ? 'Applying...' : 'Apply Coupon'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default CouponValidator;