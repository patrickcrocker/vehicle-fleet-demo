/*
 * Copyright 2015 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package demo;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.Id;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * @author Dave Syer
 *
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
@Document
public class ServiceLocation {

	@Id
	private String id;
	private String address1;
	private String address2;
	private String city;
	@JsonIgnore
	private @GeoSpatialIndexed Point location;
	private String state;
	private String zip;
	private String type;

	@SuppressWarnings("unused")
	private ServiceLocation() {
		this.location = new Point(0, 0);
	}

	@JsonCreator
	public ServiceLocation(@JsonProperty("address1") String address1,
						   @JsonProperty("address2") String address2,
						   @JsonProperty("city") String city,
						   @JsonProperty("location") Point location,
						   @JsonProperty("state") String state,
						   @JsonProperty("zip") String zip,
						   @JsonProperty("type") String type,
						   @JsonProperty("latitude") double latitude,
						   @JsonProperty("longitude") double longitude) {
		this.id = id;
		this.address1 = address1;
		this.address2 = address2;
		this.city = city;
		this.location = location;
		this.state = state;
		this.zip = zip;
		this.type = type;
		this.location = new Point(longitude, latitude);
	}

	public ServiceLocation(double latitude,
						   double longitude) {
		this.location = new Point(longitude, latitude);
	}

	public double getLatitude() {
		return this.location.getY();
	}

	public double getLongitude() {
		return this.location.getX();
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getAddress1() {
		return address1;
	}

	public void setAddress1(String address1) {
		this.address1 = address1;
	}

	public String getAddress2() {
		return address2;
	}

	public void setAddress2(String address2) {
		this.address2 = address2;
	}

	public String getCity() {
		return city;
	}

	public void setCity(String city) {
		this.city = city;
	}

	public Point getLocation() {
		return location;
	}

	public void setLocation(Point location) {
		this.location = location;
	}

	public String getState() {
		return state;
	}

	public void setState(String state) {
		this.state = state;
	}

	public String getZip() {
		return zip;
	}

	public void setZip(String zip) {
		this.zip = zip;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}
}
