import jwt from 'jsonwebtoken';

export const authentication = (req, res, next) => {
    const token = req.headers.authorization ? req.headers.authorization.split("Bearer ")[1] : null
    if (token == null) return res.status(400).send({ message: "Token inValid" });

    jwt.verify(token,process.env.JWT_ACCESS_TOKEN_SECRET, (err,decoded) => {
      if (err) return res.status(401).send({ message: "Unauthorized User Token inValid" })
      res.locals.data = decoded.data;
      next();
    })
  };
  export const jwtSign = (data, secret, time) => {
    return jwt.sign({ data: data }, secret, { expiresIn: time });
  };
