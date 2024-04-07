import "./scss/styles.scss";
import { EventEmitter } from "@/components/base/events";
import { WebLarekAPI } from "@/components/WebLarekApi";
import { API_URL, CDN_URL } from "@/utils/constants";
import { cloneTemplate, ensureElement } from "@/utils";
import { AppData } from "@/components/AppData";
import { Page } from "@/components/Page";
import { Modal } from "@/components/common/Modal";
import { Basket } from "@/components/common/Basket";
import { Order } from "@/components/Order";
import { Contacts } from "@/components/Contacts";
import { IProduct } from "@/types/product";
import { Card } from "@/components/Card";
import { Success } from "@/components/Success";
import { OrderFormType } from "@/types/order";

const events = new EventEmitter();
const api = new WebLarekAPI(CDN_URL, API_URL);

// Чтобы мониторить все события, для отладки
events.onAll(({ eventName, data }) => {
    console.log(eventName, data);
});

// Все шаблоны
const cardCatalogTemplate = ensureElement<HTMLTemplateElement>("#card-catalog");
const cardPreviewTemplate = ensureElement<HTMLTemplateElement>("#card-preview");
const cardBasketTemplate = ensureElement<HTMLTemplateElement>("#card-basket");
const orderTemplate = ensureElement<HTMLTemplateElement>("#order");
const contactsTemplate = ensureElement<HTMLTemplateElement>("#contacts");
const successTemplate = ensureElement<HTMLTemplateElement>("#success");

const modalTemplate = ensureElement<HTMLElement>("#modal-container");
// Модель данных приложения
const appData = new AppData(events);

// Глобальные контейнеры
const page = new Page(document.body, events);
const modal = new Modal(modalTemplate, events);
const basket = new Basket(events);
const order = new Order(cloneTemplate(orderTemplate), events);
const contacts = new Contacts(cloneTemplate(contactsTemplate), events);

api
    .getProductList()
    .then(appData.setItems.bind(appData))
    .catch((err) => console.log(err));

events.on("modal:open", () => {
    page.locked = true;
});

events.on("modal:close", () => {
    page.locked = false;
});

events.on("card:select", (item: IProduct) => {
    appData.setPreview(item);
});

events.on("items:change", (items: IProduct[]) => {
    page.catalog = items.map((item) => {
        const card = new Card(cloneTemplate(cardCatalogTemplate), {
            onClick: () => events.emit("card:select", item),
        });
        return card.render(item);
    });
});

events.on("preview:change", (item: IProduct) => {
    const card = new Card(cloneTemplate(cardPreviewTemplate), {
        onClick: () => {
            if (appData.inBasket(item)) {
                appData.removeFromBasket(item);
                card.button = "В корзину";
            } else {
                appData.addToBasket(item);
                card.button = "Удалить из корзины";
            }
        },
    });

    card.button = appData.inBasket(item) ? "Удалить из корзины" : "В корзину";
    modal.render({
        content: card.render(item),
    });
    modal.open();
});

events.on("basket:change", () => {
    page.counter = appData.basket.items.length;

    basket.items = appData.basket.items.map((id) => {
        const item = appData.items.find((item) => item.id === id);
        const card = new Card(cloneTemplate(cardBasketTemplate), {
            onClick: () => appData.removeFromBasket(item),
        });
        return card.render(item);
    });

    basket.total = appData.basket.total;
});

events.on("basket:open", () => {
    modal.render({ content: basket.render() });
    modal.open();
});

events.on("order:open", () => {
    modal.render({
        content: order.render({
            payment: "card",
            address: "",
            valid: false,
            errors: [],
        }),
    });
    modal.open();
});

events.on(
    /^order\..*:change/,
    (data: { field: keyof OrderFormType; value: string }) => {
        appData.setOrderField(data.field, data.value);
    },
);

events.on(
    /^contacts\..*:change/,
    (data: { field: keyof OrderFormType; value: string }) => {
        appData.setOrderField(data.field, data.value);
    },
);

events.on("formErrors:change", (errors: Partial<OrderFormType>) => {
    const { payment, address, email, phone } = errors;
    order.valid = !payment && !address;
    contacts.valid = !email && !phone;
});

events.on("order:submit", () => {
    modal.render({
        content: contacts.render({
            phone: "",
            email: "",
            valid: false,
            errors: [],
        }),
    });
});

events.on("contacts:submit", () => {
    api
        .orderProducts(appData.order)
        .then(() => {
            const success = new Success(cloneTemplate(successTemplate), {
                onClick: () => {
                    modal.close();
                },
            });
            appData.clearBasket();
            events.emit("basket:change");
            modal.render({
                content: success.render({ total: appData.order.total }),
            });
            modal.open();
        })
        .catch((err) => {
            console.error(err);
        });
});
