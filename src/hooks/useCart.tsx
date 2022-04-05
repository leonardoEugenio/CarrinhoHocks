import { title } from 'process';
import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}
interface prodInsetData {
  id: number;
  title: string;
  price: number;
  amount: number;
  image: string
}
interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const inCart = [...cart]
      const findProdInCart = inCart.find(obj => obj.id === productId)
      const prodSelected = (findProdInCart ? findProdInCart : await (await api.get(`/products/${productId}`)).data)
      const amountInStock = await (await api.get(`/stock/${productId}`)).data.amount
      var prodInsetData: prodInsetData = {
        'id': prodSelected.id,
        'title': prodSelected.title,
        'price': prodSelected.price,
        'amount': findProdInCart ? findProdInCart.amount : 1,
        'image': prodSelected.image
      }
      if (findProdInCart) {
        if (prodInsetData.amount >= amountInStock) {
          toast.error('Não foi possivel adcionar o produto no carrinho, pois já superou da quantide em stock')
          findProdInCart.amount = amountInStock
        }else{
          findProdInCart.amount ++
        }
      }else{
        inCart.push(prodInsetData)
      }
      setCart(inCart)
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(inCart));
    }
    catch {
      toast.error('Erro ao adcionar o produto no carrinho')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const inCart = [...cart]
      const findProdInCartIndex = inCart.findIndex(item => {
        return(
          item.id === productId
        ) 
      });
        inCart.splice(findProdInCartIndex, 1);
        setCart(inCart)     
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(inCart));
    } catch {
      toast.error('Não foi possivel remover tente novamente')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const inCart:Product[] = [...cart]
      const findProdInCart = inCart.find(obj => obj.id === productId)
      const amountInStock = await (await api.get(`/stock/${productId}`)).data.amount
      
      if (findProdInCart?.amount) {
        if (amount > amountInStock) {
          toast.error('Não temos mais em Stock')
          return;
        }
        findProdInCart.amount = amount
        setCart(inCart)
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(inCart));
      }
    } catch {
      toast.error('Não foi possivel atualizar a quantidade, Tente novamente')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
