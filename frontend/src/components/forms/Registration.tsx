import React from 'react';
import Input from '../Input';
import Container from '../Container';

function registration() {

    const [firstName, setFirstName] = React.useState<string>('');
    const [lastName, setLastName] = React.useState<string>('');
    const [birtDate, setBirtDate] = React.useState<Date>(new Date());
    const [email, setEmail] = React.useState<string>('');
    const [password, setPassword] = React.useState<string>('');
    const [note, setNote] = React.useState('');

    const onSubmit = () => {
        if (!firstName || !lastName || !birtDate || !email || !password || !note) {
            alert('Please fill out all fields');
            return;
        }
    }

    return (
        <div>
            <h1 classname="mb-2">Enter your info for registration</h1>
            <Container classname="d-flex gap-2">
                <Input type="firstname" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <Input type="lastname" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Container>
            <input type="date" name="birthdate" id="" value={birtDate} onChange={(e) => setBirtDate(e.target.value)} />
            <label htmlFor="">Enter your email</label>
            <input type="text" name="email" id="" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label htmlFor="">Enter password</label>
            <input type="text" name="password" id="" value={password} onChange={(e) => setPassword(e.target.value)} />
            <label htmlFor="">Leave us a note</label>
            <input type="text" name="note" id="" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
    )
}

export default registration;