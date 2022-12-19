import { useEffect, useState } from "react"
import './Home.css'
import { useAuthContext } from "../hooks/useAuthContext";
import Swal from 'sweetalert2'
// import formatDistanceToNow from 'date-fns/formatDistanceToNow'

const items = [
    'Cherry', 'Lemon', 'Orange', 'Watermelon'
]

const Home = () => {
    const {user} = useAuthContext()
    const [scores,setScores] = useState([])
    const [cards,setCards] = useState([])
    const [turn,setTurn] = useState(0)
    const [choiceOne,setChoiceOne] = useState(null)
    const [choiceTwo,setChoiceTwo] = useState(null)
    const [disabled,setDisbaled] = useState(false)
    const [win,setWin] = useState(0)
    // const [secounds,setSecounds] = useState('00')
    // const [minutes,setMinutes] = useState('00')
    const [time,setTime] = useState('00:00')
    var sec = 0
    var min = 0
    const [upTimer,setUpTimer] = useState(null)
    const [finalItems,setFinalShuffleCards] = useState([])
    const [globalScore,updateGlobalScore] = useState(0)
    const [cashoutScore,updateCashoutScore] = useState(0)
    const [loader,setLoader] = useState(true)
    const [slotLoader,setSlotLoader] = useState(false)
    const [winMessage,setWinMessage] = useState("")
    const [winClass,setWinClass] = useState("")

    useEffect(() => {
        if(win === 7 ){            
            setUpTimer(clearInterval(upTimer))
            setUpTimer(null)
            gameWin()
        }
    },[choiceOne,choiceTwo,win,upTimer])
    
    useEffect(() => {        
        fetchAllTimeScores()
    },[])

    const displaySlots = () => {
        setWinMessage('')
        setWinClass('')
        setSlotLoader(true)
        
        var finalItems = []
        updateGlobalScore(globalScore => globalScore - parseInt(1))
        updateScore('immediate')

        const randomlyShuffleItems1 = items
                                        .map(value => ({ value, sort: Math.random() }))
                                        .sort((a, b) => a.sort - b.sort)
                                        .map(({ value }) => value)

        const randomlyShuffleItems2 = items
                                        .map(value => ({ value, sort: Math.random() }))
                                        .sort((a, b) => a.sort - b.sort)
                                        .map(({ value }) => value)

        const randomlyShuffleItems3 = items
                                        .map(value => ({ value, sort: Math.random() }))
                                        .sort((a, b) => a.sort - b.sort)
                                        .map(({ value }) => value)

        finalItems.push(randomlyShuffleItems1[0], randomlyShuffleItems2[0], randomlyShuffleItems3[0])                    

        if (randomlyShuffleItems1[0] === randomlyShuffleItems2[0] && randomlyShuffleItems1[0] === randomlyShuffleItems3[0]) {
            switch (randomlyShuffleItems1[0]) {
                case 'Cherry':
                    updateCashoutScore(cashoutScore => cashoutScore + parseInt(10))
                    break;
                
                case 'Lemon':
                    updateCashoutScore(cashoutScore => cashoutScore + parseInt(20))
                    break;

                case 'Orange':
                    updateCashoutScore(cashoutScore => cashoutScore + parseInt(30))
                    break;

                case 'Watermelon':
                    updateCashoutScore(cashoutScore => cashoutScore + parseInt(40))
                    break;

                default:
                    break;
            }
    
            setWinClass('win-class');
            setTimeout(() => {
                setSlotLoader(false);
                setWinMessage('You WON!.');
            }, 500)

            setFinalShuffleCards(finalItems);
        } else {
            setTimeout(() => {
                setSlotLoader(false);
            }, 400)
            
            setFinalShuffleCards(finalItems);
        }
    }

    const updateScore = async (type = null) => {
        console.log(globalScore);

        const updatedScore = (type === 'immediate') ? (globalScore - parseInt(1)) : (parseInt(globalScore) + parseInt(cashoutScore));

        if (type !== 'immediate') {
            setLoader(true);
        }

        const response = await fetch('/api/score', {
            method : 'POST',
            headers :{
                'Content-Type' : 'application/json', 
                'Authorization' : `Bearer ${user.token}`
            },

            body : JSON.stringify({updatedScore})
        })


        if(response.ok) {
            if (type !== 'immediate') {
                fetchAllTimeScores();
                updateCashoutScore(0);
            }
        }
    }

    const gameWin = () => {   
        setTime(document.getElementById('time').innerHTML)
        if(turn && time){            
            sec = 0
            min = 0
            setWin(null)
            Swal.fire({
                text: 'Turns : '+turn + '\n' + 'Time : '+time,
                icon: 'success',
                confirmButtonText: 'Continue'
            })
            addScore(parseInt(turn),time+"")
        }        
    }

    const fetchAllTimeScores = async () => {
        const response = await fetch('/api/score/my-score',{
            method : 'GET',
            headers : {
                'Content-Type' : 'application/json', 
                'Authorization' : `Bearer ${user.token}`
            }
        })
        const json = await response.json()
        
        updateGlobalScore(globalScore => globalScore = json[0].score)

        if(response.ok) {
            setScores(json);
            setLoader(false);
        }   
    }

    const addScore = async (turn,time) => {
        const response = await fetch('/api/score',{
            method : 'POST',
            headers :{
                'Content-Type' : 'application/json', 
                'Authorization' : `Bearer ${user.token}`
            },
            body : JSON.stringify({turn,time})
        })
        const json = await response.json()

        if(!response.ok) {
            console.log(json.error);
        }
        if(response.ok) {
            console.log(json.action)
            if(json.action === "create" || json.action === "update") fetchAllTimeScores();
        } 

    }

    return (
        <>
            <div className="all-content">
                <div className="game-row">
                    <h3>WELCOME BACK</h3>
                    <button onClick={displaySlots} disabled={globalScore < -9}>New Game</button>
                    <div className="card-grid">
                        <div className={ finalItems.length <= 0 ? 'empty-slots' : 'hidden' }>
                            Lucky-Lucky slot machine! Click on <b>New Game</b> to begin.
                        </div>
                        {
                        slotLoader ? <img src="/spinner.svg" /> : finalItems.map((finalItem) => (
                            <div className={winClass ? winClass + ' card' : 'card'}>
                                {finalItem}
                            </div>
                        ))}
                    </div>
                    {
                        <div className="win-message">
                            {winMessage}
                        </div>
                    }
                    <div className="cashout">
                        <button onClick={updateScore} disabled={cashoutScore === 0} className="cashout-btn-effects">Cashout {cashoutScore}</button> 
                    </div>
                </div>
                <div className="score-row">
                    <div className="">
                        <table>
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Score</th>
                                </tr>    
                            </thead>
                            <tbody>
                                {
                                loader ? <tr><td colSpan="2"><img src="/spinner.svg" /></td></tr> : scores && scores.map((score) => (
                                    <tr key={score._id}>
                                        <td>{score.user.username}</td>
                                        <td>{globalScore}</td>
                                    </tr> 
                                    )
                                )} 
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>            
        </>
      
    )
}

export default Home;