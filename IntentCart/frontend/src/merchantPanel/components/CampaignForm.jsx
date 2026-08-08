import React, { useState } from 'react';

const CampaignForm = ({ initialData, onSubmit, onCancel, isEdit }) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        type: initialData?.type || 'discount',
        discountType: initialData?.discountType || 'percentage',
        discountValue: initialData?.discountValue || '',
        maxDiscountAmount: initialData?.maxDiscountAmount || '',
        couponCode: initialData?.couponCode || '',
        targetSegments: initialData?.targetSegments || ['all'],
        startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : '',
        endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : '',
        budget: initialData?.budget || '',
        maxUses: initialData?.maxUses || '',
        maxUsesPerCustomer: initialData?.maxUsesPerCustomer || 1,
        minOrderAmount: initialData?.minOrderAmount || '',
        productIds: initialData?.productIds || [],
        categoryIds: initialData?.categoryIds || []
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.endDate) newErrors.endDate = 'End date is required';
        if (formData.discountType !== 'free_shipping' && !formData.discountValue) {
            newErrors.discountValue = 'Discount value is required';
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const submitData = {
            ...formData,
            discountValue: parseFloat(formData.discountValue) || 0,
            maxDiscountAmount: parseFloat(formData.maxDiscountAmount) || 0,
            budget: parseFloat(formData.budget) || 0,
            maxUses: parseInt(formData.maxUses) || 0,
            maxUsesPerCustomer: parseInt(formData.maxUsesPerCustomer) || 1,
            minOrderAmount: parseFloat(formData.minOrderAmount) || 0
        };
        onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name *</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Type</label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="discount">Discount</option>
                        <option value="coupon">Coupon</option>
                        <option value="free_shipping">Free Shipping</option>
                        <option value="loyalty_reward">Loyalty Reward</option>
                        <option value="bogo">BOGO</option>
                        <option value="flash_sale">Flash Sale</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Discount Type</label>
                    <select
                        name="discountType"
                        value={formData.discountType}
                        onChange={handleChange}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                        <option value="free_shipping">Free Shipping</option>
                    </select>
                </div>
            </div>

            {formData.discountType !== 'free_shipping' && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Discount Value *</label>
                    <input
                        type="number"
                        name="discountValue"
                        value={formData.discountValue}
                        onChange={handleChange}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.01"
                        min="0"
                    />
                    {errors.discountValue && <p className="mt-1 text-xs text-red-500">{errors.discountValue}</p>}
                </div>
            )}

            {formData.discountType === 'percentage' && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Discount Amount</label>
                    <input
                        type="number"
                        name="maxDiscountAmount"
                        value={formData.maxDiscountAmount}
                        onChange={handleChange}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.01"
                        min="0"
                    />
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Coupon Code (optional)</label>
                <input
                    type="text"
                    name="couponCode"
                    value={formData.couponCode}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Leave empty for auto-generation"
                    disabled={isEdit}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                    <input
                        type="datetime-local"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
                    <input
                        type="datetime-local"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Budget</label>
                    <input
                        type="number"
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.01"
                        min="0"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Uses (0 = unlimited)</label>
                    <input
                        type="number"
                        name="maxUses"
                        value={formData.maxUses}
                        onChange={handleChange}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="1"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Uses Per Customer</label>
                    <input
                        type="number"
                        name="maxUsesPerCustomer"
                        value={formData.maxUsesPerCustomer}
                        onChange={handleChange}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        step="1"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Min Order Amount</label>
                    <input
                        type="number"
                        name="minOrderAmount"
                        value={formData.minOrderAmount}
                        onChange={handleChange}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.01"
                        min="0"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                    {isEdit ? 'Update Campaign' : 'Create Campaign'}
                </button>
            </div>
        </form>
    );
};

export default CampaignForm;