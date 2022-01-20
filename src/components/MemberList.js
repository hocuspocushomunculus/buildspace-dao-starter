const MemberList = ({ shortenAddress, memberList }) => {

    return (
        <div>
            <h2>Member List</h2>
            <table className="card">
                <thead>
                    <tr>
                        <th>Address</th>
                        <th>Token Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {memberList.map((member) => {
                        return (
                            <tr key={member.address}>
                            <td>{shortenAddress(member.address)}</td>
                            <td>{member.tokenAmount}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    )
}

export default MemberList;
