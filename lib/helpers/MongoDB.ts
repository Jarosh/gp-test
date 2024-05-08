import mongoose from 'mongoose';

export default class MongoDB {

  static connect(url: string): mongoose.Connection {
    mongoose.connect(url);
    return mongoose.connection;
  }
  
  static disconnect(): typeof mongoose {
    mongoose.connection?.close();
    return mongoose;
  }

}
