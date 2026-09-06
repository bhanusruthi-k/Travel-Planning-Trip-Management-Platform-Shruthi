package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.membership.JoinRequestResponseDTO;
import com.tripnest.tripnest_backend.service.MembershipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips/{tripId}/join-requests")
@RequiredArgsConstructor
public class JoinRequestController {

    private final MembershipService membershipService;

    @PostMapping
    public ResponseEntity<JoinRequestResponseDTO> createJoinRequest(
            @PathVariable Long tripId,
            Authentication authentication) {
        String requesterEmail = authentication.getName();
        JoinRequestResponseDTO response = membershipService.createJoinRequest(tripId, requesterEmail);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<JoinRequestResponseDTO>> getJoinRequests(
            @PathVariable Long tripId,
            Authentication authentication) {
        String requesterEmail = authentication.getName();
        List<JoinRequestResponseDTO> requests = membershipService.getJoinRequests(tripId, requesterEmail);
        return ResponseEntity.ok(requests);
    }

    @PutMapping("/{requestId}/approve")
    public ResponseEntity<JoinRequestResponseDTO> approveJoinRequest(
            @PathVariable Long tripId,
            @PathVariable Long requestId,
            Authentication authentication) {
        String requesterEmail = authentication.getName();
        JoinRequestResponseDTO response = membershipService.approveJoinRequest(tripId, requestId, requesterEmail);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{requestId}/reject")
    public ResponseEntity<JoinRequestResponseDTO> rejectJoinRequest(
            @PathVariable Long tripId,
            @PathVariable Long requestId,
            Authentication authentication) {
        String requesterEmail = authentication.getName();
        JoinRequestResponseDTO response = membershipService.rejectJoinRequest(tripId, requestId, requesterEmail);
        return ResponseEntity.ok(response);
    }
}
