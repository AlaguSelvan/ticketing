import { Message } from 'node-nats-streaming'
import mongoose from 'mongoose'
import { ExpirationCompleteEvent, OrderStatus, TicketCreatedEvent } from '@sftickets/common'
import {TicketCreatedListener} from '../ticket-created-listener'
import { natsWrapper } from '../../../nats-wrapper'
import { Order } from '../../../models/orders'
import { Ticket } from '../../../models/ticket'
import { ExpirationCompleteListener } from '../expiration-complete-listener'

const setup = async() => {
	// create an instance of the listener
	// const listener = new TicketCreatedListener(natsWrapper.client)
	const listener = new ExpirationCompleteListener(natsWrapper.client)
	// create a fake data event
	const ticket = Ticket.build({
		id: mongoose.Types.ObjectId().toHexString(),
		title: 'concert',
		price: 20
	})
	await ticket.save()
	const order = Order.build({
		status: OrderStatus.Created,
		expiresAt: new Date(),
		userId: mongoose.Types.ObjectId().toHexString(),
		ticket,
	})
	await order.save();
	const data: ExpirationCompleteEvent['data'] = {
		orderId: order.id
	}
	// create a fake message object
	// @ts-ignore
	const msg: Message = {
		ack: jest.fn()
	}
	return { listener, data, order, ticket, msg }
}


it('updates the order status to cancelled', async() => {
	const { listener, order, ticket, data, msg } = await setup()
	// call the onMessage function with the data object + message object
	await listener.onMessage(data, msg);0
	// write assertions to make sure a ticket was created!
	const updatedOrder = await Order.findById(order.id)
	expect(updatedOrder.status).toEqual(OrderStatus.Cancelled)
})

it('emit an OrderCancelled event', async() => {
	const { listener, order, ticket, data, msg } = await setup()
	// call the onMessage function with the data object + message object
	await listener.onMessage(data, msg);

	expect(natsWrapper.client.publish).toHaveBeenCalled();

	const eventData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1])
	expect(eventData.id).toEqual(order.id)
	// write assertions to make sure a ticket was created!
})

it('ack the message', async() => {
	const { listener, order, ticket, data, msg } = await setup()
	// call the onMessage function with the data object + message object
	await listener.onMessage(data, msg);

	expect(msg.ack).toHaveBeenCalled()
	// write assertions to make sure a ticket was created!
})
