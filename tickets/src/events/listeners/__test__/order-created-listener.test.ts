import { Message } from 'node-nats-streaming'
import mongoose, { Mongoose } from 'mongoose'
import { TicketCreatedEvent, OrderCreatedEvent, OrderStatus } from '@sftickets/common'
import {OrderCreatedListener} from '../order-created-listener'
import { natsWrapper } from '../../../nats-wrapper'
import { Ticket } from '../../../models/ticket'

const setup = async() => {
	// create an instance of the listener
	const listener = new OrderCreatedListener(natsWrapper.client)

	// create and save a ticket
	const ticket = Ticket.build({
		title: 'concert',
		price: 10,
		userId: new mongoose.Types.ObjectId().toHexString()
	})

	await ticket.save();
	// create a fake data event
	const data: OrderCreatedEvent['data'] = {
		id: new mongoose.Types.ObjectId().toHexString(),
		status: OrderStatus.Created,
		userId: new mongoose.Types.ObjectId().toHexString(),
		version: 0,
		expiresAt: new Date().toUTCString(),
		ticket: {
			id: ticket.id,
			price: ticket.price,
		}
	}
	// create a fake message object
	// @ts-ignore
	const msg: Message = {
		ack: jest.fn()
	}
	return { listener, data, msg }
}


it('sets the userId of the ticket', async() => {
	const { listener, data, msg } = await setup()
	// call the onMessage function with the data object + message object
	await listener.onMessage(data, msg)
	// write assertions to make sure a ticket was created!
	const updatedTicket = await Ticket.findById(data.ticket.id);
	expect(updatedTicket).toBeDefined()
	expect(updatedTicket?.orderId).toEqual(data.id)
	expect(updatedTicket?.price).toEqual(data.ticket.price)
})

it('acks the message', async() => {
	const { data, listener, msg } = await setup()
	// call the onMessage function with the data object + message object
	await listener.onMessage(data, msg);
	// write assertions to make sure ack function is called!
	expect(msg.ack).toHaveBeenCalled();
})

it('publishes a ticket updated event', async() => {
	const { data, listener, msg } = await setup()
	// call the onMessage function with the data object + message object
	await listener.onMessage(data, msg);
	// write assertions to make sure ack function is called!
	expect(natsWrapper.client.publish).toHaveBeenCalled();

	const ticketUpdatedData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1]);
	expect(data.id).toEqual(ticketUpdatedData.orderId)
})
