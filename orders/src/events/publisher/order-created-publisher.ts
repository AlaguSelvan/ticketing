import { Publisher, Subjects, OrderCreatedEvent } from '@sftickets/common'

export class OrderCreatedEventPublisher extends Publisher<OrderCreatedEvent>{
	subject: Subjects.OrderCreated = Subjects.OrderCreated;
}
