import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ChevronDown, ChevronRight, Settings, Target, Users, Image as ImageIcon } from 'lucide-react';

const CampaignForm = ({ initialData, onSubmit, onCancel, isEdit, isSubmitting }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'discount',
        discountType: 'percentage',
        discountValue: 0,
        maxDiscountAmount: 0,
        couponCode: '',
        startDate: '',
        endDate: '',
        minOrderAmount: 0,
        maxUses: 0,
        maxUsesPerCustomer: 1,
        budget: 0,

        // Single Image URL
        imageUrl: '',
        imageAlt: '',

        targetProducts: 'all',
        productIds: [],
        categoryIds: [],
        customerTiers: 'all',
    });

    // UI State
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showImages, setShowImages] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchProductsAndCategories();
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                type: initialData.type || 'discount',
                discountType: initialData.discountType || 'percentage',
                discountValue: initialData.discountValue || 0,
                maxDiscountAmount: initialData.maxDiscountAmount || 0,
                couponCode: initialData.couponCode || '',
                startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
                endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
                minOrderAmount: initialData.minOrderAmount || 0,
                maxUses: initialData.maxUses || 0,
                maxUsesPerCustomer: initialData.maxUsesPerCustomer || 1,
                budget: initialData.budget || 0,
                imageUrl: initialData.imageUrl || '',
                imageAlt: initialData.imageAlt || '',
                targetProducts: initialData.targetProducts || 'all',
                productIds: initialData.productIds || [],
                categoryIds: initialData.categoryIds || [],
                customerTiers: initialData.customerTiers || 'all',
            });
        }
    }, [initialData]);

    const fetchProductsAndCategories = async () => {
        try {
            //  replace with actual API calls
            setProducts([
                { _id: '1', name: 'US Polo ASSN. T-Shirt' },
                { _id: '2', name: "Levi's Jeans" },
                { _id: '3', name: 'Allen Solly Formal Shirt' },
                { _id: '4', name: 'Fastrack Watch' },
            ]);
            setCategories([
                { _id: 'clothing', name: 'Clothing' },
                { _id: 'accessories', name: 'Accessories' },
            ]);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleArrayToggle = (field, id) => {
        setFormData(prev => {
            const currentArray = prev[field] || [];
            const newArray = currentArray.includes(id)
                ? currentArray.filter(item => item !== id)
                : [...currentArray, id];
            return { ...prev, [field]: newArray };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            toast.error('Campaign name is required');
            return;
        }
        if (!formData.startDate || !formData.endDate) {
            toast.error('Start date and end date are required');
            return;
        }
        if (new Date(formData.startDate) >= new Date(formData.endDate)) {
            toast.error('End date must be after start date');
            return;
        }
        if (formData.type === 'coupon' && !formData.couponCode) {
            toast.error('Coupon code is required');
            return;
        }
        if (formData.discountValue <= 0) {
            toast.error('Discount value must be greater than 0');
            return;
        }

        const submitData = {
            name: formData.name,
            description: formData.description,
            type: formData.type,
            discountType: formData.discountType,
            discountValue: formData.discountValue,
            maxDiscountAmount: formData.maxDiscountAmount,
            couponCode: formData.type === 'coupon' ? formData.couponCode : undefined,
            startDate: new Date(formData.startDate),
            endDate: new Date(formData.endDate),
            minOrderAmount: formData.minOrderAmount,
            maxUses: formData.maxUses,
            maxUsesPerCustomer: formData.maxUsesPerCustomer,
            budget: formData.budget,
            imageUrl: formData.imageUrl || undefined,
            imageAlt: formData.imageAlt || undefined,
            targetProducts: formData.targetProducts,
            productIds: formData.productIds,
            categoryIds: formData.categoryIds,
            customerTiers: formData.customerTiers,
        };

        if (isEdit && initialData) {
            onSubmit(initialData._id, submitData);
        } else {
            onSubmit(submitData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto px-2">
            {/* Campaign Name */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Campaign Name *
                </label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Summer Sale 2024"
                    required
                />
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of your campaign"
                />
            </div>

            {/* Type & Discount */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Campaign Type *
                    </label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        <option value="discount">Discount</option>
                        <option value="coupon">Coupon</option>
                        <option value="free_shipping">Free Shipping</option>
                        <option value="bogo">BOGO</option>
                        <option value="flash_sale">Flash Sale</option>
                        <option value="loyalty_reward">Loyalty Reward</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Discount Type
                    </label>
                    <select
                        name="discountType"
                        value={formData.discountType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount ($)</option>
                        <option value="free_shipping">Free Shipping</option>
                    </select>
                </div>
            </div>

            {/* Discount Value & Max */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Discount Value *
                    </label>
                    <input
                        type="number"
                        name="discountValue"
                        value={formData.discountValue}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Max Discount Amount
                    </label>
                    <input
                        type="number"
                        name="maxDiscountAmount"
                        value={formData.maxDiscountAmount}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0 (unlimited)"
                        min="0"
                        step="0.01"
                    />
                </div>
            </div>

            {/* Coupon Code (only for coupon type) */}
            {formData.type === 'coupon' && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Coupon Code *
                    </label>
                    <input
                        type="text"
                        name="couponCode"
                        value={formData.couponCode}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                        placeholder="Enter coupon code"
                        required
                    />
                </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Start Date *
                    </label>
                    <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        End Date *
                    </label>
                    <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Min Order Amount
                    </label>
                    <input
                        type="number"
                        name="minOrderAmount"
                        value={formData.minOrderAmount}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        min="0"
                        step="0.01"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Max Uses
                    </label>
                    <input
                        type="number"
                        name="maxUses"
                        value={formData.maxUses}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0 (unlimited)"
                        min="0"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Per Customer
                    </label>
                    <input
                        type="number"
                        name="maxUsesPerCustomer"
                        value={formData.maxUsesPerCustomer}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1"
                        min="0"
                    />
                </div>
            </div>

            {/* Image Section - Simplified */}
            <div className="border-t pt-4 border-slate-200">
                <button
                    type="button"
                    onClick={() => setShowImages(!showImages)}
                    className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                >
                    <ImageIcon className="w-4 h-4" />
                    Campaign Image
                    {showImages ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {showImages && (
                    <div className="mt-4 space-y-3 p-4 bg-slate-50 rounded-lg">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Image URL
                            </label>
                            <input
                                type="url"
                                name="imageUrl"
                                value={formData.imageUrl}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="https://example.com/campaign-image.jpg"
                            />
                            {formData.imageUrl && (
                                <div className="mt-2">
                                    <img
                                        src={formData.imageUrl}
                                        alt="Preview"
                                        className="max-h-32 rounded-lg border border-slate-200 object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Image Alt Text (Accessibility)
                            </label>
                            <input
                                type="text"
                                name="imageAlt"
                                value={formData.imageAlt}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="Describe the image for accessibility"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Advanced Options (Collapsible) */}
            <div className="border-t pt-4 border-slate-200">
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                >
                    <Settings className="w-4 h-4" />
                    Advanced Targeting Options
                    {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {showAdvanced && (
                    <div className="mt-4 space-y-4 p-4 bg-slate-50 rounded-lg">
                        {/* Product Targeting */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Target className="w-4 h-4" />
                                Product Targeting
                            </label>
                            <select
                                name="targetProducts"
                                value={formData.targetProducts}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="all">All Products</option>
                                <option value="selected">Selected Products</option>
                                <option value="categories">By Categories</option>
                            </select>

                            {formData.targetProducts === 'selected' && (
                                <div className="mt-2 max-h-32 overflow-y-auto border rounded p-2 bg-white">
                                    {products.map(p => (
                                        <label key={p._id} className="flex items-center gap-2 py-1 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={formData.productIds.includes(p._id)}
                                                onChange={() => handleArrayToggle('productIds', p._id)}
                                            />
                                            <span>{p.name}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {formData.targetProducts === 'categories' && (
                                <div className="mt-2 max-h-32 overflow-y-auto border rounded p-2 bg-white">
                                    {categories.map(c => (
                                        <label key={c._id} className="flex items-center gap-2 py-1 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={formData.categoryIds.includes(c._id)}
                                                onChange={() => handleArrayToggle('categoryIds', c._id)}
                                            />
                                            <span>{c.name}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Customer Targeting */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Users className="w-4 h-4" />
                                Customer Targeting
                            </label>
                            <select
                                name="customerTiers"
                                value={formData.customerTiers}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="all">All Customers</option>
                                <option value="platinum">Platinum</option>
                                <option value="gold">Gold</option>
                                <option value="silver">Silver</option>
                                <option value="bronze">Bronze</option>
                                <option value="new_customers">New Customers</option>
                                <option value="inactive_customers">Inactive Customers</option>
                            </select>
                        </div>

                        {/* Budget */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Budget (Optional)
                            </label>
                            <input
                                type="number"
                                name="budget"
                                value={formData.budget}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="0 (unlimited)"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50"
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-6 py-2 bg-[#1e1b4b] text-white rounded-lg text-sm hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                        </>
                    ) : (
                        isEdit ? 'Update Campaign' : 'Create Campaign'
                    )}
                </button>
            </div>
        </form>
    );
};

export default CampaignForm;