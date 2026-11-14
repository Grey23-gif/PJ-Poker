import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Product, ProductCategory } from '../../types/pos';
import { usePosStore } from '../../stores/posStore';

interface ProductManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductManagementModal: React.FC<ProductManagementModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { addProduct, updateProduct } = usePosStore();

  const [name, setName] = useState(productToEdit?.name || '');
  const [code, setCode] = useState(productToEdit?.code || '');
  const [category, setCategory] = useState<ProductCategory>(productToEdit?.category || 'COFFEE');
  const [price, setPrice] = useState<string>(productToEdit ? String(productToEdit.price) : '35000');
  const [costPrice, setCostPrice] = useState<string>(productToEdit?.costPrice ? String(productToEdit.costPrice) : '15000');
  const [image, setImage] = useState(productToEdit?.image || '');
  const [description, setDescription] = useState(productToEdit?.description || '');
  const [stock, setStock] = useState<string>(productToEdit?.stock ? String(productToEdit.stock) : '100');
  const [error, setError] = useState('');

  // Synchronize when productToEdit changes
  React.useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCode(productToEdit.code);
      setCategory(productToEdit.category);
      setPrice(String(productToEdit.price));
      setCostPrice(String(productToEdit.costPrice || 0));
      setImage(productToEdit.image || '');
      setDescription(productToEdit.description || '');
      setStock(String(productToEdit.stock || 50));
    } else {
      setName('');
      setCode(`CF-${Math.floor(10 + Math.random() * 89)}`);
      setCategory('COFFEE');
      setPrice('35000');
      setCostPrice('15000');
      setImage('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300');
      setDescription('');
      setStock('100');
    }
    setError('');
  }, [productToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Vui lòng nhập tên món/sản phẩm');
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Đơn giá bán phải lớn hơn 0 ₫');
      return;
    }

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        name: name.trim(),
        code: code.trim(),
        category,
        price: numPrice,
        costPrice: Number(costPrice) || 0,
        image: image.trim() || undefined,
        description: description.trim() || undefined,
        stock: Number(stock) || 50,
      });
    } else {
      addProduct({
        name: name.trim(),
        code: code.trim() || `PR-${Date.now()}`,
        category,
        price: numPrice,
        costPrice: Number(costPrice) || 0,
        image: image.trim() || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300',
        description: description.trim() || undefined,
        isAvailable: true,
        stock: Number(stock) || 50,
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={productToEdit ? 'Chỉnh Sửa Sản Phẩm Cafe' : 'Thêm Món Mới Vào Menu Cafe'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Mã sản phẩm (SKU)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="CF-01, TEA-02..."
          />
          <Select
            label="Danh mục món"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
          >
            <option value="COFFEE">Cà phê đặc biệt</option>
            <option value="TEA">Trà & Trà sữa</option>
            <option value="COLD_BEV">Đồ uống mát & Tăng lực</option>
            <option value="FOOD">Món ăn nóng</option>
            <option value="SNACK">Món nhắm & Snack</option>
            <option value="POKER_SPECIAL">Combo Poker All-in</option>
          </Select>
        </div>

        <Input
          label="Tên sản phẩm *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Cà phê Muối, Bạc Xỉu, Khô Bò..."
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Giá bán (VND) *"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="35000"
          />
          <Input
            label="Giá vốn ước tính (VND)"
            type="number"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            placeholder="15000"
          />
          <Input
            label="Số lượng tồn kho"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="100"
          />
        </div>

        <Input
          label="URL hình ảnh món"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://images.unsplash.com/..."
        />

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Mô tả món</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            rows={2}
            placeholder="Mô tả hương vị hoặc thành phần..."
          />
        </div>

        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Hủy Bỏ
          </Button>
          <Button variant="primary" type="submit">
            {productToEdit ? 'Cập Nhật' : 'Tạo Mới Món'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

