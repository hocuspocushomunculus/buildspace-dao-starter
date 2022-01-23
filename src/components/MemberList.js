import { Segment, Table } from 'semantic-ui-react';

const MemberList = ({ shortenAddress, memberList }) => {

    return (
        <Segment inverted>
            <h2>Member List</h2>
            <Table celled inverted selectable>
                <Table.Header>
                    <Table.HeaderCell>Address</Table.HeaderCell>
                    <Table.HeaderCell>Token Amount</Table.HeaderCell>
                </Table.Header>
                <Table.Body>
                    {memberList.map((member) => {
                        return (
                            <Table.Row key={member.address}>
                                <Table.Cell>{shortenAddress(member.address)}</Table.Cell>
                                <Table.Cell>{member.tokenAmount}</Table.Cell>
                            </Table.Row>
                        );
                    })}
                </Table.Body>
            </Table>
        </Segment>
    )
}

export default MemberList;
