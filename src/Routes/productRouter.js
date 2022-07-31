import userModal from '../Modal/userModal';
import productModal from '../Modal/productModal';
import { authentication } from '../Middleware/auth'
import mongoose from 'mongoose';

const toId = mongoose.Types.ObjectId;

const getProductRoutes = (router) => {
    
    router.post('/create-product', async (req, res) => {
        try {
            const product = new productModal(req.body);
            const result = await product.save();
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });

    router.get('/product/:id', authentication ,async (req, res) => {
        try {
            const process = await productModal.findById(req.params.id);
            res.status(200).send(process)
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });

    router.get('/all-product', authentication ,async (req, res) => {
        try {
            const page = Number(req.query.pageNumber) || 1; // the current page number being fetched
            const pageSize = Number(req.query.pageSize) || 10; // the total number of entries on a single page
        
            // match all products which include the string of chars in the keyword, not necessarily in the given order
            const keyword = req.query.keyword
                ? {
                        name: {
                            $regex: req.query.keyword,
                            $options: 'si',
                        },
                  }
                : {};
            const count = await productModal.countDocuments({ ...keyword }); // total number of products which match with the given key
        
            // find all products that need to be sent for the current page, by skipping the documents included in the previous pages
            // and limiting the number of documents included in this request
            const products = await productModal.find({ ...keyword })
                .limit(pageSize)
                .skip(pageSize * (page - 1));
        
            // send the list of products, current page number, total number of pages available
            res.status(200).send({ products, page, pages: Math.ceil(count / pageSize) })
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });

    router.post('/review/:id/:userId', async (req, res) => {
        try {
            const { id, userId } = req.params;
            const { review, rating} = req.body;
            const user = await userModal.findById(userId);
            const product = await userModal.findById(id);
            if(product){
                const reviewedAlready = product.reviews.find(
                    (rev) => rev.user.toString() === userId.toString()
                );
                if (reviewedAlready) {
                    res.status(400);
                    throw new Error('Product Already Reviewed');
                }
                const userReview = {
                    user: toId(user._id),
                    name : user.firstName,
                    rating: Number(rating),
                    review,
                }
                product.reviews.push(userReview);
                product.numReviews = product.reviews.length;
                product.rating = product.reviews.reduce((acc, ele) => acc + ele.rating, 0) / product.numReviews;
                const result = await product.save();
                    res.status(200).send(result); 
            } else {
                res.status(404).send('Product not available')
            }
           
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });
    router.get('/get-topproduct', authentication, async (req, res) => {
        try {
            const product = await productModal.find({}).sort({ rating: -1 }).limit(4);
            res.status(200).send(product);
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });
    return router;
}

export default getProductRoutes;