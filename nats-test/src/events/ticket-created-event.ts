import { Subjects } from './subjects'

interface Data {
	id: string;
	title: string;
	price: number;
	userId: string;
}

export interface TicketCreatedEvent {
	subject: Subjects.TicketCreated;
	data: Data
}
