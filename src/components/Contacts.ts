import { Form } from "@/components/common/Form";
import { OrderFormType } from "@/types/order";
import { EventEmitter } from "@/components/base/events";

export class Contacts extends Form<OrderFormType> {
    constructor(container: HTMLFormElement, events: EventEmitter) {
        super(container, events);
    }

    set email(value: string) {
        (this.container.elements.namedItem("email") as HTMLInputElement).value =
            value;
    }

    set phone(value: string) {
        (this.container.elements.namedItem("phone") as HTMLInputElement).value =
            value;
    }
}
