import { Publisher, Subjects, TicketUpdatedEvent } from '@sftickets/common'

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
	subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
}