import { PaymentMethodType } from "@/types/payment";

export type OrderFormType = Omit<IOrder, "total" | "items">;

export interface IOrder {
    payment: PaymentMethodType;
    email: string;
    phone: string;
    address: string;
    items: string[];
    total: number;
}

export interface IOrderResult {
    id: string;
    total: number;
}
