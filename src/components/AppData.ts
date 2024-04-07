import { IProduct } from "@/types/product";
import { IBasket } from "@/types/basket";
import { IOrder, OrderFormType } from "@/types/order";
import { IEvents } from "@/components/base/events";
import { PaymentMethodType } from "@/types/payment";

export class AppData {
    items: IProduct[] = [];
    basket: IBasket = {
        items: [],
        total: 0,
    };
    preview: IProduct = null;
    order: IOrder = {
        email: "",
        phone: "",
        address: "",
        payment: "card",
        total: 0,
        items: [],
    };

    formErrors: Partial<Record<keyof OrderFormType, string>> = {};

    protected events: IEvents;

    constructor(events: IEvents) {
        this.events = events;
    }

    setItems(items: IProduct[]) {
        this.items = items;
        this.events.emit("items:change", this.items);
    }

    setPreview(item: IProduct) {
        this.preview = item;
        this.events.emit("preview:change", item);
    }

    inBasket(item: IProduct) {
        return this.basket.items.includes(item.id);
    }

    addToBasket(item: IProduct) {
        this.basket.items.push(item.id);
        this.basket.total += item.price;
        this.events.emit("basket:change", this.basket);
    }

    removeFromBasket(item: IProduct) {
        this.basket.items = this.basket.items.filter((id) => id != item.id);
        this.basket.total -= item.price;
        this.events.emit("basket:change", this.basket);
    }

    clearBasket() {
        this.basket.items = [];
        this.basket.total = 0;
        this.events.emit("basket:change");
    }

    setPaymentMethod(method: PaymentMethodType) {
        this.order.payment = method;
    }

    setOrderField(field: keyof OrderFormType, value: string) {
        if (field === "payment") {
            this.setPaymentMethod(value as PaymentMethodType);
        } else {
            this.order[field] = value;
        }

        if (this.order.payment && this.validateOrder()) {
            this.order.total = this.basket.total;
            this.order.items = this.basket.items;
        }
    }

    validateOrder() {
        const errors: typeof this.formErrors = {};

        const email_regex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+.[a-zA-Z0-9_-]+)/;

        if (!this.order.email) {
            errors.email = "Необходимо указать email";
        }

        if (!email_regex.test(this.order.email)) {
            errors.email = "Необходимо указать корректный email";
        }

        if (!this.order.phone) {
            errors.phone = "Необходимо указать телефон";
        }
        if (!this.order.address) {
            errors.phone = "Необходимо указать адрес";
        }

        this.formErrors = errors;
        this.events.emit("formErrors:change", this.formErrors);
        return Object.keys(errors).length === 0;
    }
}
