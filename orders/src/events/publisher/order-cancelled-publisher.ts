import { Publisher, Subjects, OrderCancelledEvent } from '@sftickets/common'

export class OrderCancelledEventPublisher extends Publisher<OrderCancelledEvent>{
	subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
}
