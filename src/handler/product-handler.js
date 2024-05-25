const express = require('express');
const admin = require('firebase-admin');
const multer = require('multer');
require('dotenv').config();

const productHandler = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

productHandler.get('/product', async (req, res) => {
  try {
    const products = await admin.firestore().collection('product').get();
    const productList = [];
    products.forEach((product) => {
      productList.push({
        idProduct: product.id,
        name: product.data().name,
        image: product.data().image,
        price: product.data().price,
        description: product.data().description,
        rate: product.data().rate,
        category: product.data().category,
        idFarm: product.data().idFarm,
      });
    });
    res.status(200).json(productList);
  } catch (error) {
    console.error('Kesalahan mengambil produk:', error);
    res.status(500).json({ error: 'Kesalahan Server Internal' });
  }
});

productHandler.get('/product/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await admin.firestore().collection('product').doc(productId).get();
    if (!product.exists) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }
    res.status(200).json({
      idProduct: product.id,
      name: product.data().name,
      image: product.data().image,
      price: product.data().price,
      description: product.data().description,
      rate: product.data().rate,
      category: product.data().category,
      idFarm: product.data().idFarm,
    });
  } catch (error) {
    console.error('Kesalahan mengambil produk:', error);
    res.status(500).json({ error: 'Kesalahan Server Internal' });
  }
});

productHandler.post('/product', upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, rate, category, idFarm } = req.body;
    const file = req.file;

    const fileName = `${Date.now()}_${file.originalname}`;
    const bucket = admin.storage().bucket('farm-fresh-d8e1b.appspot.com');

    const fileUpload = bucket.file(fileName);
    await fileUpload.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;

    const product = await admin.firestore().collection('product').add({
      name,
      image: imageUrl,
      price,
      description,
      rate,
      category,
      idFarm,
    });
    res.status(201).json({ message: 'Produk berhasil ditambahkan', id: product.id });
  } catch (error) {
    console.error('Kesalahan menambahkan produk:', error);
    res.status(500).json({ error: 'Kesalahan Server Internal' });
  }
});

productHandler.put('/product/:id', upload.single('image'), async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, price, description, rate, category, idFarm } = req.body;
    const file = req.file;

    let imageUrl;

    if (file) {
      const fileName = `${Date.now()}_${file.originalname}`;
      const bucket = admin.storage().bucket('farm-fresh-d8e1b.appspot.com');

      const fileUpload = bucket.file(fileName);
      await fileUpload.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
      });

      imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;
    }

    const productDoc = await admin.firestore().collection('product').doc(productId).get();
    if (!productDoc.exists) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    const existingProductData = productDoc.data();

    const updatedProductData = {
      name: name || existingProductData.name,
      price: price || existingProductData.price,
      description: description || existingProductData.description,
      rate: rate || existingProductData.rate,
      category: category || existingProductData.category,
      idFarm: idFarm || existingProductData.idFarm,
      image: imageUrl || existingProductData.image,
    };

    Object.keys(updatedProductData).forEach(key => {
      if (updatedProductData[key] === undefined) {
        delete updatedProductData[key];
      }
    });

    await admin.firestore().collection('product').doc(productId).update(updatedProductData);

    res.status(200).json({ message: 'Produk berhasil diperbarui' });
  } catch (error) {
    console.error('Kesalahan memperbarui produk:', error);
    res.status(500).json({ error: 'Kesalahan Server Internal' });
  }
});

productHandler.delete('/product/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await admin.firestore().collection('product').doc(productId).delete();
    res.status(200).json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('Kesalahan menghapus produk:', error);
    res.status(500).json({ error: 'Kesalahan Server Internal' });
  }
});

module.exports = productHandler;
