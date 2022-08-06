import  moment from 'moment';

const formatMessage = (data) => {
    const msg = {
        from:data.fromUser,
        to:data.toUser,
        message:data.msg,
        date: moment(data.date).format("YYYY-MM-DD"),
        time: moment(data.date).format("hh:mm a")
    }
    return msg;
}
 export default formatMessage;
