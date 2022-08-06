import userModal from '../Modal/userModal';
import postModal from '../Modal/postModal';
import commentModal from '../Modal/commentModal';
import { chatModal } from '../Modal/chatsModal';
import { authentication } from '../Middleware/auth'
import generateToken from '../Utils/tokenGenerator';
import sendMail from '../Utils/sendMail';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken'

const toId = mongoose.Types.ObjectId;

const getUserRoutes = (router) => {
    router.get('/', (req, res) => res.send('1Password Vaults Access Management Application'));
    router.get('/ping', (req, res) => res.send({ status: 'active', time: new Date() }));
    
    router.post('/create-user', async (req, res) => {
        try {
            const { firstName, lastName, email, password } = req.body;
            const userExists = await userModal.findOne({ email });
            if (userExists) {
                res.status(400).send({message: 'Email already registered'});
            }
            const user = await userModal.create({
                firstName,
                lastName,
                email,
                password: password.toString(),
            });
            await sendMail(user._id, email, 'email verification');
            const data = {
                user: user,
                message: "Signup Successfully",
                accessToken: generateToken(user._id,'access'),
                refreshToken: generateToken(user._id,'refresh'),
            };
            res.status(200).send(data)
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });

    router.post('/login', async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await userModal.findOne({ email: email });
            if(!user) {
                res.status(404).send({message: 'user Not Found'}); 
            }
            if(!user.isConfirmed) {
                res.status(401).send({message: 'Your Account is not verified'}); 
            }
            // if(user.onlineUser) {
            //     res.status(401).send({message: 'User Already logged in'}); 
            // }
            if(user.password.toString() === password) {
                user.onlineUser = true
                await user.save();
            const data = {
                user: user,
                message: 'Signin Successfully',
                accessToken: generateToken(user._id,'access'),
                refreshToken: generateToken(user._id,'refresh'),
            };
                res.status(200).send(data); 
            } else{
                res.status(401).send({message: 'Password Incorrect'});
            }
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });

    router.post('/logout',async(req,res) => {
        try {
            const { id }= req.body;
            const user = await userModal.findById(id);
              user.onlineUser = false;
              await user.save();
              res.status(200).send(user);
        } catch(err) {
            res.status(500).send({ message: err.message });
        }
    });

    // router.get('/update-user/:id',authentication,async(req,res) => {
    //     try {
    //         const id = req.params.id;
    //         const user = await userModal.findById(id);
    //           user.onlineUser = false;
    //     } catch(err) {

    //     }
    // });

    router.get('/get-user/:id',authentication,async(req,res) => {
        try {
            const id = req.params.id;
            const user = await userModal.findById(id)
            .select('-password')
            .populate({ path: 'followers.user', model: 'user'})
            .populate({ path: 'following.user', model: 'user'});
            if(!user) {
                res.status(400).send({message: 'User Not Found' });
            }
            res.status(200).send(user);
        } catch(error) {
            res.status(500).send({message: error.message});
        }
    })

    router.get('/get-alluser',authentication,async(req,res) => {
        try {
            const { offset,limit } = req.query;
            console.log("resss",res.locals.data.id);
            const user = await userModal.find({ "_id": { "$ne": res.locals.data.id } })
            .select('-password').populate({ path: 'followers.user', model: 'user'})
            .populate({ path: 'following.user', model: 'user'})
            .skip(offset)
            .limit(limit);
            let total = await userModal.countDocuments()
            res.status(200).send({user,total});
        } catch(error) {
            res.status(500).send({message: error.message});
        }
    })

    router.get('/search/:keyword',authentication,async(req,res) => {
        try {
            const { keyword } = req.params;
            console.log("keyword",keyword)
            if(!keyword) {
                console.log("keyword not found")
            }
            const regex = new RegExp(keyword, "i");
            const curUser = await userModal.findById(res.locals.data.id)
            .select('-password').populate({ path: 'followers.user', model: 'user'})
            .populate({ path: 'following.user', model: 'user'});
           const fUser = curUser.followers.length > 0 ? curUser.followers.map((e) => {
                return e.user.email
            }) : [];
            const tUser = curUser.following.length > 0 ? curUser.following.map((e) => {
                return e.user.email
            }) : [];
            const user = await userModal.find({ 
                "$or": [
                    { firstName: regex },
                    { lastName: regex  }
                ]
            })
            .select('-password')
            .populate({ path: 'followers.user', model: 'user'})
            .populate({ path: 'following.user', model: 'user'})
            const data = user.map(e => {
                if(fUser.includes(e.email) || tUser.includes(e.email)) {
                    return e;
                }
            }).filter(f => f !== undefined);
              res.status(200).send(data);
        } catch(error) {
            res.status(500).send({message: error.message});
        }
    })

    router.put('/user-verification/:token',async(req,res) => {
        try {
            
            const emailToken = req.params.token;
            if (!emailToken) return res.status(400).send({ message: "Email Verification Token inValid" });

            const decodedToken = await jwt.verify(emailToken,process.env.JWT_EMAIL_TOKEN_SECRET, (err,decoded) => {
                if (err) return res.status(401).send({ message: "Email Verification Token Expired" })
                return decoded;
              })
            const user = await userModal.findById(decodedToken.id).select('-password');
            user.isConfirmed = true;
            const updatedUser = await user.save();
            res.status(200).send({
                data: updatedUser,
                message: 'Email verified Successfully',
                accessToken: generateToken(user._id, 'access'),
                refreshToken: generateToken(user._id, 'refresh'),
            });
        } catch (error) {
            res.status(500).send({message: error.message});
        }
    });

    router.post('/email-verification',async(req,res) => {
        try {
            const { email } = req.body;
            const user = await userModal.findOne({ email });
            if (user) {
                if (!user.isConfirmed) {
                    await sendMail(user._id, email, 'email verification');
                    res.status(201).json({
                        id: user._id,
                        email: user.email,
                        name: user.name,
                        isAdmin: user.isAdmin,
                        avatar: user.avatar,
                        isConfirmed: user.isConfirmed,
                    });
                } else {
                    res.status(400).send({message: 'User already confirmed' });
                }
            }
        } catch (error) {
            console.log(error);
            res.status(401).send({message: 'Could not send the mail. Please retry.'});
        }
    });

    router.put('/reset-password',async(req,res) => {
        try {
            const { passwordToken, password } = req.body;
            if (!passwordToken) return res.status(400).send({ message: 'Password Token inValid'});

            const decodedToken = await jwt.verify(passwordToken,process.env.JWT_EMAIL_TOKEN_SECRET, (err,decoded) => {
                if (err) return res.status(401).send({ message: 'Password Token Expired' })
                return decoded
            });
            const user = await userModal.findById(decodedToken.id).select('-password');
            if (user && password) {
            user.password = password;
            }
            const updatedUser = await user.save();
            res.status(200).send({
                data: updatedUser,
                message: 'Password Reset Successfully'
            });
        } catch (error) {
            res.status(500).send({message: error.message});
        }
    });

    router.get('/forgot-password',async(req,res) => {
        try {
            const user = await userModal.findOne({ email });
            if (user && user.isConfirmed) {
                await sendMail(user._id, email, 'forgot password');
                res.status(201).json({
                   data: user,
                   message: 'Forgot Mail Sent Successfully'
                });
            }
        } catch (error) {
            console.log(error);
            res.status(401);
            throw new Error('Could not send the mail. Please retry.');
        }
    });

    router.post('/follow/:id', async (req, res) => {
        try {
            const { id } = req.body;
            const user = await userModal.findById(req.params.id);
            const follower = await userModal.findById(id);
            const fromChat = await chatModal.find().where('from').equals(follower.email).where('to').equals(user.email);
            const toChat = await chatModal.find().where('to').equals(follower.email).where('from').equals(user.email);
            const followUser = {
              user: follower._id,
              chat: [...fromChat,...toChat]
            }
            const followingUser = {
                user: user._id,
                chat: [...fromChat,...toChat]
              }
            user.followers.push(followUser);
            follower.following.push(followingUser);
            if(!follower) {
                res.status(404).send({data:"Following user not exist"}); 
            }
            await user.save();
            await follower.save();
                res.status(200).send(user); 
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });

    router.post('/unfollow/:id', async (req, res) => {
        try {
            const { id } = req.body;
            const user = await userModal.findById(req.params.id);
            const follower = await userModal.findById(id);
            user.followers.splice(user.followers.findIndex(({user}) => user === toId(id)),1);
            follower.following.splice(follower.following.findIndex(({user}) => user === toId(req.params.id)),1);
            if(!follower) {
                res.status(404).send({data:"Following user not exist"}); 
            }
            await user.save();
            await follower.save();
                res.status(200).send(user); 
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });

    router.post('/refresh-token', async (req, res) => {
        const { token } = req.body;
        if (token == null) return res.status(400),send({data: { message: "Token inValid" }})
        jwt.verify(token, process.env.JWT_REFRESH_TOKEN_SECRET, (err, decoded) => {
             if (err) return res.status(401).send({data: { message: "Refresh Token inValid" }})
             const token = generateToken(decoded.data.id,'access');
             return res.status(200).send(token);
         });
    });

    router.post('/create-post/:userId', authentication ,async (req, res) => {
        try {
            const post = new postModal(req.body);
            post.user = toId(req.params.userId);
            await post.save().then(async (response) => {
                const user = await userModal.findById(req.params.userId);
                user.posts.push(toId(response.id))
                await user.save();
                res.status(200).send(response)
            });
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });

    router.get('/get-allpost/:id', authentication ,async (req, res) => {
        try {
            const user = await userModal.findById(req.params.id);
            const posts = await postModal.find({$or:[{user:user._id},{user:{$in:user.followers}}]});
            res.status(200).send(posts)
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });
    router.get('/get-post/:Id', authentication, async (req, res) => {
        try {
            console.log("res---->",res.locals.jwt);
            const result = await postModal.findById(req.params.Id).populate('user').populate('comments').populate('like');
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });
    router.post('/create-comment/:userId/:postId', authentication, async (req, res) => {
        try {
            const comment = new commentModal(req.body);
            comment.user = toId(req.params.userId);
            comment.post = toId(req.params.postId);
            await comment.save().then(async (response) => {
                const post = await postModal.findById(req.params.postId);
                post.comments.push(toId(response.id))
                await post.save();
                res.status(200).send(response);
            });
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });
    router.post('/like-post/:userId/:postId', authentication, async (req, res) => {
        try {
            const post = await postModal.findById(req.params.postId);
            if (post.like.includes(req.params.userId)) {
                post.like = post.like.splice(post.like.findIndex((id) => id === req.params.userId), 0)
            } else {
                post.like.push(toId(req.params.userId));
            }
            const result = await post.save();
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });
    router.post('/like-comment/:userId/:commentId', authentication, async (req, res) => {
        try {
            const comment = await commentModal.findById(req.params.commentId);
            if (comment.like.includes(req.params.userId)) {
                comment.like = comment.like.splice(comment.like.findIndex((id) => id === req.params.userId), 0)
            } else {
                comment.like.push(toId(req.params.userId));
            }
            const result = await comment.save();
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });
    router.get('/get-comment/:Id', authentication, async (req, res) => {
        try {
            const result = await (await commentModal.findById(req.params.Id).populate('user').populate('post')).populate('like');
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });
    return router;
}

export default getUserRoutes;