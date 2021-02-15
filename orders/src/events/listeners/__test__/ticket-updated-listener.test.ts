import mongoose from 'mongoose'
import { Message } from 'node-nats-streaming'
import { TicketUpdatedEvent } from '@sftickets/common'
import { TicketUpdatedListener } from '../ticket-updated-listener'
import { natsWrapper } from '../../../nats-wrapper'
import { Ticket } from '../../../models/ticket'

const setup = async() => {
	// create an instance of the listener

	// Create a ticket
	const listener = new TicketUpdatedListener(natsWrapper.client)
  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20,
  });
  await ticket.save();

	// create a fake data event
	const data: TicketUpdatedEvent['data'] = {
		id: ticket.id,
		title: 'concert (edited)',
		price: 10,
		userId: new mongoose.Types.ObjectId().toHexString(),
		version: ticket.version + 1,
	}
	// create a fake message object
	// @ts-ignore
	const msg: Message = {
		ack: jest.fn()
	}
	return { listener, ticket, data, msg }
}


it('finds, updates and saves a ticket', async() => {
	const { listener, data, ticket, msg } = await setup()
	// call the onMessage function with the data object + message object
	await listener.onMessage(data, msg);
	// write assertions to make sure a ticket was created!
	const updatedTicket = await Ticket.findById(ticket.id);
	expect(updatedTicket).toBeDefined()
	expect(updatedTicket?.title).toEqual(data.title)
	expect(updatedTicket?.price).toEqual(data.price)
	expect(updatedTicket?.version).toEqual(data.version)
})


it('acks the message', async() => {
	// call the onMessage function with the data object + message object
	const { msg, data, listener } = await setup()

	await listener.onMessage(data, msg);

	expect(msg.ack).toHaveBeenCalled();
	// write assertions to make sure ack function is called!
})

it('does not call ack if the event has a skipped version number', async() => {
	const { msg, data, listener, ticket } = await setup()

	data.version = 10;

	try {
		await listener.onMessage(data,msg);
	} catch(err) {

	}

	expect(msg.ack).not.toHaveBeenCalled()

})