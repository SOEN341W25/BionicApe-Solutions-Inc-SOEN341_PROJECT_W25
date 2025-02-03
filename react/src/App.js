import React, {useEffect, useState} from 'react'

function App(){
    const [backendData, setBackendData] = useState([{}])
    
    useEffect(() => {
        fetch("/api/user").then(
            response => response.json()
        ).then(
            data => {
                console.log(JSON.stringify(data))
                setBackendData(data)
            }
        )
    },[])
    
    return (
        <div>

            
            
        This is REACT JS!!!
        {(typeof backendData === 'undefined')?  (
            <p> Loading...</p>
        ) : (
            backendData.map((user, i) => (
                <p key={i}>{user.username}</p>   
            ))
        )}
        
        </div>
        

    )
    
}

export default App;
