const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
require('dotenv').config();

const paymentHandler = express.Router();

paymentHandler.use(bodyParser.json());

paymentHandler.get('/payment', async (req, res) => {
  try {
    const payments = await admin.firestore().collection('payments').get();
    const paymentList = [];
    payments.forEach((payment) => {
      paymentList.push({
        idPayment: payment.id,
        name: payment.data().name,
        quantity: payment.data().quantity,
        price: payment.data().price,
        total: payment.data().total,
        description: payment.data().description,
      });
    });
    res.status(200).json(paymentList);
  } catch (error) {
    console.error('Kesalahan mengambil pembayaran:', error);
    res.status(500).json({ error: 'Kesalahan Server Internal' });
  }
});

paymentHandler.get('/payment/:id', async (req, res) => {
  try {
    const paymentId = req.params.id;
    const payment = await admin.firestore().collection('payments').doc(paymentId).get();
    if (!payment.exists) {
      return res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
    }
    res.status(200).json({
      idPayment: payment.id,
      name: payment.data().name,
      quantity: payment.data().quantity,
      price: payment.data().price,
      total: payment.data().total,
      description: payment.data().description,
    });
  } catch (error) {
    console.error('Kesalahan mengambil pembayaran:', error);
    res.status(500).json({ error: 'Kesalahan Server Internal' });
  }
});

paymentHandler.post('/payment', async (req, res) => {
  try {
    const { name, quantity, price, total, description } = req.body;

    const payment = await admin.firestore().collection('payments').add({
      name,
      quantity,
      price,
      total,
      description,
    });
    res.status(201).json({ message: 'Pembayaran berhasil ditambahkan', id: payment.id });
  } catch (error) {
    console.error('Kesalahan menambahkan pembayaran:', error);
    res.status(500).json({ error: 'Kesalahan Server Internal' });
  }
});

paymentHandler.put('/payment/:id', async (req, res) => {
  try {
    const paymentId = req.params.id;
    const { name, quantity, price, total, description } = req.body;

    const paymentDoc = await admin.firestore().collection('payments').doc(paymentId).get();
    if (!paymentDoc.exists) {
      return res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
    }

    const existingPaymentData = paymentDoc.data();

    const updatedPaymentData = {
      name: name || existingPaymentData.name,
      quantity: quantity || existingPaymentData.quantity,
      price: price || existingPaymentData.price,
      total: total || existingPaymentData.total,
      description: description || existingPaymentData.description,
    };

    await admin.firestore().collection('payments').doc(paymentId).update(updatedPaymentData);

    res.status(200).json({ message: 'Pembayaran berhasil diperbarui' });
  } catch (error) {
    console.error('Kesalahan memperbarui pembayaran:', error);
    res.status(500).json({ error: 'Kesalahan Server Internal' });
  }
});

paymentHandler.delete('/payment/:id', async (req, res) => {
  try {
    const paymentId = req.params.id;
    const payment = await admin.firestore().collection('payments').doc(paymentId).delete();
    res.status(200).json({ message: 'Pembayaran berhasil dihapus' });
  } catch (error) {
    console.error('Kesalahan menghapus pembayaran:', error);
    res.status(500).json({ error: 'Kesalahan Server Internal' });
  }
});

module.exports = paymentHandler;