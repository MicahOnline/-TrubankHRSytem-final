import React from 'react';
import { LeaveRequest, User, LeavePolicy } from '../../types';
import { getLeaveDuration } from '../utils/export';

interface PrintableLeaveFormProps {
  request: LeaveRequest | null;
  user: User | null;
  policy: LeavePolicy | null;
}

const FormLogo: React.FC = () => (
    <div className="flex items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center p-1">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 4H11V12H6V14H11V20H12.5V14H18V12H12.5V4Z" fill="white"/>
            </svg>
        </div>
        <div>
            <h1 className="text-2xl font-bold">First TRuBank</h1>
            <p className="text-sm font-semibold">A Rural Bank, Inc.</p>
        </div>
    </div>
);


const PrintableLeaveForm: React.FC<PrintableLeaveFormProps> = ({ request, user, policy }) => {
  if (!request || !user || !policy) {
    return null;
  }

  const duration = getLeaveDuration(request.startDate, request.endDate);
  
  const Checkbox = ({ checked }: { checked: boolean }) => (
    <div className="flex items-center font-serif text-lg">
        <span>[</span>
        <span className="w-4 text-center font-bold">{checked ? 'X' : ' '}</span>
        <span>]</span>
    </div>
  );

  return (
    <div className="font-sans text-black bg-white p-4">
        <div className="w-full border-4 border-black p-4 space-y-2 text-sm">
            {/* Header */}
            <div className="flex justify-between items-start pb-2 border-b-4 border-black">
                <FormLogo />
                <div className="text-right flex-shrink-0">
                    <p>Personnel Form No. __________</p>
                    <p>Date Prepared: <span className="font-bold">{new Date().toLocaleDateString()}</span></p>
                </div>
            </div>

            <h1 className="text-center font-bold text-lg pt-2">APPLICATION FOR LEAVE</h1>

            {/* User Details Table */}
            <table className="w-full border-collapse border border-black">
                <tbody>
                    <tr>
                        <td className="w-1/3 border border-black p-1">Name & Designation:<br /><span className="font-bold pl-2">{user.name} / {user.role}</span></td>
                        <td className="w-1/3 border border-black p-1">Employment Status:<br /><span className="font-bold pl-2">******</span></td>
                        <td className="w-1/3 border border-black p-1">Branch/Department:<br /><span className="font-bold pl-2">{user.department}</span></td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1">Address while on Leave:<br /><span className="font-bold pl-2">******</span></td>
                        <td className="border border-black p-1">Date Employed:<br /><span className="font-bold pl-2">******</span></td>
                        <td className="border border-black p-1">Daily/Monthly Rate:<br /><span className="font-bold pl-2"></span></td>
                    </tr>
                </tbody>
            </table>

            {/* Leave Applied For Table */}
            <p className="font-bold pt-2">Leave applied for (Check action desired)</p>
            <table className="w-full border-collapse border border-black">
                <thead>
                    <tr>
                        <th className="w-[50%] border border-black p-1 text-left"></th>
                        <th className="w-[16.66%] border border-black p-1">DAYS</th>
                        <th className="w-[16.66%] border border-black p-1">From</th>
                        <th className="w-[16.66%] border border-black p-1">To</th>
                    </tr>
                </thead>
                <tbody>
                    {policy.availableLeaveTypes.map((leaveTypeSetting, index) => (
                        <tr key={leaveTypeSetting.name}>
                            <td className="border border-black p-1">
                                <div className="flex items-center gap-2">
                                    <Checkbox checked={request.leaveType === leaveTypeSetting.name} />
                                    {leaveTypeSetting.name}
                                </div>
                            </td>
                            {index === 0 && (
                                <>
                                    <td rowSpan={policy.availableLeaveTypes.length} className="border border-black p-1 text-center align-top font-bold">{duration} day/s</td>
                                    <td rowSpan={policy.availableLeaveTypes.length} className="border border-black p-1 text-center align-top font-bold">{request.startDate}</td>
                                    <td rowSpan={policy.availableLeaveTypes.length} className="border border-black p-1 text-center align-top font-bold">{request.endDate}</td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* REASONS */}
            <div className="border border-black p-1">
                <p className="font-bold">REASONS:</p>
                <p className="pl-4 pt-1 pb-4 font-bold">{request.reason}</p>
            </div>
            
            {/* LEAVE DATA */}
            <h2 className="text-center font-bold tracking-[0.2em] text-lg pt-4">LEAVE DATA</h2>
            <table className="w-full border-collapse border border-black">
                <tbody>
                    <tr><td className="w-1/3 border border-black p-1">Days entitled to:</td><td className="w-2/3 border border-black p-1"></td></tr>
                    <tr><td className="border border-black p-1">Days taken:</td><td className="border border-black p-1"></td></tr>
                    <tr><td className="border border-black p-1">Balance:</td><td className="border border-black p-1"></td></tr>
                    <tr><td className="border border-black p-1">Days applied for:</td><td className="border border-black p-1"><span className="font-bold pl-2">{duration}</span></td></tr>
                    <tr><td className="border border-black p-1">Balance of Leave:</td><td className="border border-black p-1"></td></tr>
                </tbody>
            </table>

            {/* Signatures */}
            <table className="w-full mt-6">
                <tbody>
                    <tr>
                        <td className="w-1/2 p-1 text-center align-bottom">
                            <p>Requested by:</p>
                            <p className="pt-10 font-bold border-b-2 border-black w-3/4 mx-auto">{user.name}</p>
                        </td>
                        <td className="w-1/2 p-1 text-center align-bottom">
                            <p>Approved by:</p>
                            <p className="pt-10 font-bold border-b-2 border-black w-3/4 mx-auto"></p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default PrintableLeaveForm;
