import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const data = await AsyncStorage.getItem('@GoMarketplace:products');

      if (data) {
        setProducts(JSON.parse(data));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productsList = [...products];
      const productIndex = productsList.findIndex(product => product.id === id);

      if (productIndex >= 0) {
        productsList[productIndex].quantity += 1;

        setProducts(productsList);
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(productsList),
        );
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productsList = [...products];
      const productIndex = productsList.findIndex(product => product.id === id);

      if (productIndex >= 0) {
        if (productsList[productIndex].quantity === 1) {
          setProducts(productsList.filter(product => product.id !== id));
          await AsyncStorage.setItem(
            '@GoMarketplace:products',
            JSON.stringify(productsList),
          );
        } else {
          productsList[productIndex].quantity -= 1;

          setProducts(productsList);
          await AsyncStorage.setItem(
            '@GoMarketplace:products',
            JSON.stringify(productsList),
          );
        }
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const productExists = products.find(
        stateProduct => stateProduct.id === product.id,
      );

      if (!productExists) {
        const newProduct = { ...product, quantity: 1 };

        setProducts([...products, newProduct]);
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify([...products, newProduct]),
        );
      } else {
        increment(product.id);
      }
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
